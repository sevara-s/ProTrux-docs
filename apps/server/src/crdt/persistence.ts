import * as Y from 'yjs';
import { db } from '../db/database.js';
import {
  setPersistence,
  docs,
  type WSSharedDoc,
} from './y-websocket-utils.js';

interface PersistedDocMeta {
  updateCount: number;
  compactionTimeout?: NodeJS.Timeout;
  compacting: boolean;
  generation: number;
}

const docMeta = new Map<string, PersistedDocMeta>();

export function initCRDTPersistence() {
  setPersistence({
    bindState: (docName: string, ydoc: WSSharedDoc) => {
      try {
        // Rooms must be created via REST — do not auto-create on WS bind
        if (!db.getDocument(docName)) {
          console.warn(`[CRDT Persistence] Refusing bind for unknown doc: ${docName}`);
          return;
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

        ydoc.on('update', (update: Uint8Array, origin: unknown) => {
          if (origin === 'db_load') return;

          try {
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

    writeState: async (docName: string, ydoc: WSSharedDoc) => {
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
        const current = docMeta.get(docName);
        if (current && current.generation === generation) {
          if (current.compactionTimeout) clearTimeout(current.compactionTimeout);
          docMeta.delete(docName);
        }
      }
    },
  });
}

async function compactDoc(docName: string, ydoc: WSSharedDoc, generation?: number) {
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

  const liveDoc = docs.get(docName);
  if (!liveDoc) return;

  try {
    if (liveDoc.conns && typeof liveDoc.conns.forEach === 'function') {
      const sockets: WebSocketLike[] = [];
      liveDoc.conns.forEach((_subs, conn) => sockets.push(conn as WebSocketLike));
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

type WebSocketLike = { close: (code?: number, reason?: string) => void };

/** Flush every live room to SQLite (graceful shutdown). */
export async function flushAllRooms() {
  const entries: Array<[string, WSSharedDoc]> = [];
  docs.forEach((ydoc, name) => entries.push([name, ydoc]));

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

export { docs, docMeta };
