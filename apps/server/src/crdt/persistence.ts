import * as Y from 'yjs';
import { db } from '../db/database';
// @ts-ignore
import utils from 'y-websocket/bin/utils';

const { setPersistence, docs } = utils;

interface PersistedDocMeta {
  updateCount: number;
  compactionTimeout?: NodeJS.Timeout;
}

const docMeta = new Map<string, PersistedDocMeta>();

export function initCRDTPersistence() {
  setPersistence({
    bindState: (docName: string, ydoc: any) => {
      try {
        // 1. Load latest snapshot
        const snapshot = db.getSnapshot(docName);
        if (snapshot) {
          Y.applyUpdate(ydoc, snapshot, 'db_load');
        }

        // 2. Load and apply any incremental updates since snapshot
        const updates = db.getUpdates(docName);
        for (const update of updates) {
          Y.applyUpdate(ydoc, update, 'db_load');
        }

        docMeta.set(docName, { updateCount: 0 });

        // 3. Listen for live updates arriving from clients
        ydoc.on('update', (update: Uint8Array, origin: any) => {
          if (origin === 'db_load') return;

          try {
            db.saveUpdate(docName, update);

            const meta = docMeta.get(docName) || { updateCount: 0 };
            meta.updateCount++;

            // Debounced snapshot compaction
            if (meta.compactionTimeout) {
              clearTimeout(meta.compactionTimeout);
            }

            // Compact if >= 50 updates or after 10s of quiet time
            if (meta.updateCount >= 50) {
              compactDoc(docName, ydoc);
              meta.updateCount = 0;
            } else {
              meta.compactionTimeout = setTimeout(() => {
                compactDoc(docName, ydoc);
                meta.updateCount = 0;
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
      try {
        compactDoc(docName, ydoc);
      } catch (err) {
        console.error(`[CRDT Persistence] Error during writeState for ${docName}:`, err);
      }
    },
  });
}

function compactDoc(docName: string, ydoc: any) {
  try {
    const snapshot = Y.encodeStateAsUpdate(ydoc);
    db.saveSnapshotAndPruneUpdates(docName, snapshot);

    // Extract basic text preview from Tiptap fragment if available
    try {
      const fragment = ydoc.getXmlFragment('default');
      const text = fragment.toString().replace(/<[^>]*>/g, ' ').slice(0, 150).trim();
      if (text) {
        db.updateDocument(docName, { previewText: text });
      }
    } catch {
      // ignore text extraction errors
    }
  } catch (err) {
    console.error(`[CRDT Persistence] Compaction error for ${docName}:`, err);
  }
}

export { docs, utils };
