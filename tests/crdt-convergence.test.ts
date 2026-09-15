import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { Database } from '../apps/server/src/db/database';
import fs from 'node:fs';
import path from 'node:path';

describe('CRDT Mathematical Convergence & Offline Resilience', () => {
  it('should deterministically converge two concurrent online edits without data loss', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const textA = docA.getText('content');
    const textB = docB.getText('content');

    // Sync initial state
    textA.insert(0, 'Initial base document. ');
    const initialUpdate = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, initialUpdate);

    expect(textB.toString()).toBe('Initial base document. ');

    // User A edits at end
    textA.insert(textA.length, 'Edited by User A.');

    // User B edits at start
    textB.insert(0, 'Header: ');

    // Exchange binary delta updates
    const updateFromA = Y.encodeStateAsUpdate(docA, Y.encodeStateVector(docB));
    const updateFromB = Y.encodeStateAsUpdate(docB, Y.encodeStateVector(docA));

    Y.applyUpdate(docB, updateFromA);
    Y.applyUpdate(docA, updateFromB);

    // Assert absolute convergence
    expect(textA.toString()).toBe(textB.toString());
    expect(textA.toString()).toContain('Header: ');
    expect(textA.toString()).toContain('Initial base document. ');
    expect(textA.toString()).toContain('Edited by User A.');
  });

  it('should flawlessly merge offline disconnected edits upon network restoration', () => {
    const docOnline = new Y.Doc();
    const docOffline = new Y.Doc();

    const onlineText = docOnline.getText('default');
    const offlineText = docOffline.getText('default');

    // Both start in sync
    onlineText.insert(0, 'Line 1\nLine 2\nLine 3');
    Y.applyUpdate(docOffline, Y.encodeStateAsUpdate(docOnline));

    // NETWORK PARTITION OCCURS: docOffline is disconnected
    // Online user adds a comment to Line 2
    onlineText.insert(13, ' [reviewed by Alice]');

    // Offline user types new section at bottom while in airplane mode
    offlineText.insert(offlineText.length, '\nLine 4: Written entirely offline on a plane');

    // Offline user also fixes typo in Line 1
    offlineText.insert(6, ' (verified)');

    // NETWORK RESTORED: State Vector delta exchange
    const stateVectorOnline = Y.encodeStateVector(docOnline);
    const stateVectorOffline = Y.encodeStateVector(docOffline);

    const deltaForOffline = Y.encodeStateAsUpdate(docOnline, stateVectorOffline);
    const deltaForOnline = Y.encodeStateAsUpdate(docOffline, stateVectorOnline);

    Y.applyUpdate(docOffline, deltaForOffline);
    Y.applyUpdate(docOnline, deltaForOnline);

    // Verify deterministic convergence
    expect(onlineText.toString()).toBe(offlineText.toString());

    const mergedContent = onlineText.toString();
    expect(mergedContent).toContain('[reviewed by Alice]');
    expect(mergedContent).toContain('Written entirely offline on a plane');
    expect(mergedContent).toContain('(verified)');
  });

  it('should persist updates to SQLite and restore via snapshot compaction', () => {
    const testDbPath = path.resolve(__dirname, '../data/test-persistence.sqlite');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const testDb = new Database(testDbPath);
    const testDocId = 'test-doc-compaction';
    testDb.createDocument(testDocId, 'Test Persistence Document');

    const sourceDoc = new Y.Doc();
    const fragment = sourceDoc.getXmlFragment('default');

    // Create incremental updates
    const updates: Uint8Array[] = [];
    sourceDoc.on('update', (update) => {
      updates.push(update);
      testDb.saveUpdate(testDocId, update);
    });

    const ytext1 = new Y.XmlText('Paragraph 1: Saved in SQLite. ');
    fragment.insert(0, [ytext1]);

    const ytext2 = new Y.XmlText('Paragraph 2: Second delta update.');
    fragment.insert(1, [ytext2]);

    expect(updates.length).toBeGreaterThanOrEqual(2);

    // Perform compaction into single snapshot
    const compactedSnapshot = Y.encodeStateAsUpdate(sourceDoc);
    testDb.saveSnapshotAndPruneUpdates(testDocId, compactedSnapshot);

    // Incremental updates table should now be empty (compacted)
    const storedUpdatesAfterCompaction = testDb.getUpdates(testDocId);
    expect(storedUpdatesAfterCompaction.length).toBe(0);

    // Snapshot should exist
    const retrievedSnapshot = testDb.getSnapshot(testDocId);
    expect(retrievedSnapshot).not.toBeNull();

    // Restore into a brand new Y.Doc from disk
    const restoredDoc = new Y.Doc();
    Y.applyUpdate(restoredDoc, retrievedSnapshot!);

    expect(restoredDoc.getXmlFragment('default').toString()).toBe(sourceDoc.getXmlFragment('default').toString());

    // Clean up test DB
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });
});
