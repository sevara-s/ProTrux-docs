/**
 * Server CRDT persistence.
 *
 * IMPORTANT: y-websocket loads Yjs via CJS `require('yjs')`. Importing Yjs as
 * ESM here creates a SECOND copy (Node dual-package hazard). Encoding/applying
 * updates across copies silently drops data — text vanishes after refresh.
 * Always use the CJS build below for anything touching WSSharedDoc.
 */
import { createRequire } from 'node:module';
import { db } from '../db/database.js';
import {
  setPersistence,
  docs,
  type WSSharedDoc,
} from './y-websocket-utils.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Y = require('yjs') as typeof import('yjs');

interface PersistedDocMeta {
  updateCount: number;
  compactionTimeout?: NodeJS.Timeout;
  compacting: boolean;
  generation: number;
}

const docMeta = new Map<string, PersistedDocMeta>();

/**
 * y-websocket calls `docs.delete(name)` IMMEDIATELY after invoking writeState,
 * without awaiting it. Flush must complete synchronously before that returns.
 */
function flushDocToDb(docName: string, ydoc: WSSharedDoc): void {
  if (!db.getDocument(docName)) return;

  const fragment = ydoc.getXmlFragment('default');
  const existingSnap = db.getSnapshot(docName);

  if (fragment.length === 0 && existingSnap && existingSnap.byteLength > 8) {
    console.warn(
      `[CRDT Persistence] Skip empty overwrite for ${docName} (keeping ${existingSnap.byteLength}B snapshot)`
    );
    return;
  }

  const maxUpdateId = db.getMaxUpdateId(docName);
  const snapshot = Y.encodeStateAsUpdate(ydoc);
  db.saveSnapshotAndPruneUpdates(docName, snapshot, maxUpdateId);

  try {
    const text = fragment
      .toString()
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 150)
      .trim();
    if (text) {
      db.updateDocument(docName, { previewText: text });
    }
  } catch {
    // ignore text extraction errors
  }
}

export function initCRDTPersistence() {
  setPersistence({
    bindState: (docName: string, ydoc: WSSharedDoc) => {
      try {
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
            if (meta.updateCount >= 8) {
              compactDoc(docName, gen);
            } else {
              meta.compactionTimeout = setTimeout(() => {
                compactDoc(docName, gen);
              }, 1500);
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

      try {
        flushDocToDb(docName, ydoc);
      } catch (err) {
        console.error(`[CRDT Persistence] Error during writeState for ${docName}:`, err);
      } finally {
        docMeta.delete(docName);
      }
    },
  });
}

function compactDoc(docName: string, generation?: number) {
  const meta = docMeta.get(docName);
  if (!meta) return;
  if (generation !== undefined && meta.generation !== generation) return;
  if (meta.compacting) return;

  const liveDoc = docs.get(docName);
  if (!liveDoc) return;

  meta.compacting = true;
  try {
    flushDocToDb(docName, liveDoc);
    meta.updateCount = 0;
    if (meta.compactionTimeout) {
      clearTimeout(meta.compactionTimeout);
      meta.compactionTimeout = undefined;
    }
  } catch (err) {
    console.error(`[CRDT Persistence] Compaction error for ${docName}:`, err);
  } finally {
    const still = docMeta.get(docName);
    if (still) still.compacting = false;
  }
}

export function destroyRoom(docName: string) {
  const meta = docMeta.get(docName);
  if (meta?.compactionTimeout) {
    clearTimeout(meta.compactionTimeout);
  }
  docMeta.delete(docName);

  const liveDoc = docs.get(docName);
  if (!liveDoc) return;

  try {
    flushDocToDb(docName, liveDoc);
  } catch {
    // best-effort
  }

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
      flushDocToDb(name, ydoc);
    } catch (err) {
      console.error(`[CRDT Persistence] Flush failed for ${name}:`, err);
    }
  }
}

export { docs, docMeta };
