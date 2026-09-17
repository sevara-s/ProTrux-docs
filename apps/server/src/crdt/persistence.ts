import * as Y from 'yjs';
import { db } from '../db/database.js';
// @ts-ignore — y-websocket ships CJS utils without types for custom persistence hooks
import utils from 'y-websocket/bin/utils';

const { setPersistence, docs } = utils;

interface PersistedDocMeta {
  updateCount: number;
  compactionTimeout?: NodeJS.Timeout;
  compacting: boolean;
  generation: number;
}

const docMeta = new Map<string, PersistedDocMeta>();

export function initCRDTPersistence() {
  setPersistence({
    bindState: (docName: string, ydoc: any) => {
      try {
        // Ensure metadata row exists before accepting CRDT traffic
        if (!db.getDocument(docName)) {
          const readableTitle = docName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          db.createDocument(docName, readableTitle || 'Untitled Document');
        }

        const snapshot = db.getSnapshot(docName);
        if (snapshot) {
          Y.applyUpdate(ydoc, snapshot, 'db_load');
        }

        const updates = db.getUpdates(docName);
        for (const update of updates) {
          Y.applyUpdate(ydoc, update, 'db_load');
        }

        const generation = (docMeta.get(docName)?.generation ?? 0) + 1;
        docMeta.set(docName, { updateCount: 0, compacting: false, generation });

        ydoc.on('update', (update: Uint8Array, origin: any) => {
          if (origin === 'db_load') return;

          try {
            // Refuse writes for deleted / unknown docs (prevents delete resurrection)
            if (!db.getDocument(docName)) {
              return;
            }

            db.saveUpdate(docName, update);

            const meta = docMeta.get(docName);
            if (!meta) return;

            meta.updateCount++;

            if (meta.compactionTimeout) {
              clearTimeout(meta.compactionTimeout);
              meta.compactionTimeout = undefined;
            }

            const gen = meta.generation;
            if (meta.updateCount >= 50) {
              void compactDoc(docName, ydoc, gen);
            } else {
              meta.compactionTimeout = setTimeout(() => {
                void compactDoc(docName, ydoc, gen);
              }, 10000);
            }
          } catch (err) {
            console.error(`[CRDT Persistence] Error saving update for ${docName}:`, err);
          }
        });
      } catch (err) {
        console.error(`[CRDT Persistence] Failed to bind state for ${docName}:`, err);
      }
    },

    writeState: async (docName: string, ydoc: any) => {
      const meta = docMeta.get(docName);
      if (meta?.compactionTimeout) {
        clearTimeout(meta.compactionTimeout);
        meta.compactionTimeout = undefined;
      }
      const generation = meta?.generation ?? 0;

      try {
        await compactDoc(docName, ydoc, generation);
      } catch (err) {
        console.error(`[CRDT Persistence] Error during writeState for ${docName}:`, err);
      } finally {
        // Room is being discarded — drop timers/meta so stale callbacks no-op
        const current = docMeta.get(docName);
        if (current && current.generation === generation) {
          if (current.compactionTimeout) clearTimeout(current.compactionTimeout);
          docMeta.delete(docName);
        }
      }
    },
  });
}

async function compactDoc(docName: string, ydoc: any, generation?: number) {
  const meta = docMeta.get(docName);
  if (!meta) return;
  if (generation !== undefined && meta.generation !== generation) return;
  if (meta.compacting) return;
  if (!db.getDocument(docName)) return;

  meta.compacting = true;

  try {
    const maxUpdateId = db.getMaxUpdateId(docName);
    const snapshot = Y.encodeStateAsUpdate(ydoc);
    db.saveSnapshotAndPruneUpdates(docName, snapshot, maxUpdateId);

    // Re-check generation after encode (room may have been recycled)
    const still = docMeta.get(docName);
    if (!still || (generation !== undefined && still.generation !== generation)) {
      return;
    }

    still.updateCount = 0;
    if (still.compactionTimeout) {
      clearTimeout(still.compactionTimeout);
      still.compactionTimeout = undefined;
    }

    try {
      const fragment = ydoc.getXmlFragment('default');
      const text = fragment
        .toString()
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 150)
        .trim();
      if (text && db.getDocument(docName)) {
        db.updateDocument(docName, { previewText: text });
      }
    } catch {
      // ignore text extraction errors
    }
  } catch (err) {
    console.error(`[CRDT Persistence] Compaction error for ${docName}:`, err);
  } finally {
    const still = docMeta.get(docName);
    if (still) still.compacting = false;
  }
}

/** Close all sockets, clear timers, and drop the in-memory room (used by DELETE). */
export function destroyRoom(docName: string) {
  const meta = docMeta.get(docName);
  if (meta?.compactionTimeout) {
    clearTimeout(meta.compactionTimeout);
  }
  docMeta.delete(docName);

  const liveDoc = docs.get(docName) as any;
  if (!liveDoc) return;

  try {
    if (liveDoc.conns && typeof liveDoc.conns.forEach === 'function') {
      const sockets: any[] = [];
      liveDoc.conns.forEach((_subs: unknown, conn: any) => sockets.push(conn));
      for (const conn of sockets) {
        try {
          conn.close(1000, 'Document deleted');
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    liveDoc.destroy();
  } catch {
    // ignore
  }
  docs.delete(docName);
}

/** Flush every live room to SQLite (graceful shutdown). */
export async function flushAllRooms() {
  const entries: Array<[string, any]> = [];
  docs.forEach((ydoc: any, name: string) => entries.push([name, ydoc]));

  for (const [name, ydoc] of entries) {
    const meta = docMeta.get(name);
    if (meta?.compactionTimeout) {
      clearTimeout(meta.compactionTimeout);
      meta.compactionTimeout = undefined;
    }
    try {
      await compactDoc(name, ydoc, meta?.generation);
    } catch (err) {
      console.error(`[CRDT Persistence] Flush failed for ${name}:`, err);
    }
  }
}

export { docs, utils, docMeta };
