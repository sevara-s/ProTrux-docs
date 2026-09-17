import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { Database } from '../apps/server/src/db/database';
import fs from 'node:fs';
import path from 'node:path';

const testDbPath = path.resolve(__dirname, '../data/test-persistence.sqlite');

function wipeTestDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    const p = testDbPath + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

/** TipTap/ProseMirror binds to Y.XmlFragment('default') — exercise that shape, not bare Y.Text. */
function seedParagraph(doc: Y.Doc, text: string) {
  const fragment = doc.getXmlFragment('default');
  const paragraph = new Y.XmlElement('paragraph');
  const ytext = new Y.XmlText();
  ytext.insert(0, text);
  paragraph.insert(0, [ytext]);
  fragment.insert(0, [paragraph]);
}

function appendParagraph(doc: Y.Doc, text: string) {
  const fragment = doc.getXmlFragment('default');
  const paragraph = new Y.XmlElement('paragraph');
  const ytext = new Y.XmlText();
  ytext.insert(0, text);
  paragraph.insert(0, [ytext]);
  fragment.insert(fragment.length, [paragraph]);
}

function fragmentPlain(doc: Y.Doc): string {
  return doc.getXmlFragment('default').toString();
}

describe('CRDT Mathematical Convergence & Offline Resilience', () => {
  beforeEach(() => {
    wipeTestDb();
  });

  afterEach(() => {
    wipeTestDb();
  });

  it('should deterministically converge two concurrent online edits without data loss', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const textA = docA.getText('content');
    const textB = docB.getText('content');

    textA.insert(0, 'Initial base document. ');
    const initialUpdate = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, initialUpdate);

    expect(textB.toString()).toBe('Initial base document. ');

    textA.insert(textA.length, 'Edited by User A.');
    textB.insert(0, 'Header: ');

    const updateFromA = Y.encodeStateAsUpdate(docA, Y.encodeStateVector(docB));
    const updateFromB = Y.encodeStateAsUpdate(docB, Y.encodeStateVector(docA));

    Y.applyUpdate(docB, updateFromA);
    Y.applyUpdate(docA, updateFromB);

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

    onlineText.insert(0, 'Line 1\nLine 2\nLine 3');
    Y.applyUpdate(docOffline, Y.encodeStateAsUpdate(docOnline));

    onlineText.insert(13, ' [reviewed by Alice]');
    offlineText.insert(offlineText.length, '\nLine 4: Written entirely offline on a plane');
    offlineText.insert(6, ' (verified)');

    const stateVectorOnline = Y.encodeStateVector(docOnline);
    const stateVectorOffline = Y.encodeStateVector(docOffline);

    const deltaForOffline = Y.encodeStateAsUpdate(docOnline, stateVectorOffline);
    const deltaForOnline = Y.encodeStateAsUpdate(docOffline, stateVectorOnline);

    Y.applyUpdate(docOffline, deltaForOffline);
    Y.applyUpdate(docOnline, deltaForOnline);

    expect(onlineText.toString()).toBe(offlineText.toString());

    const mergedContent = onlineText.toString();
    expect(mergedContent).toContain('[reviewed by Alice]');
    expect(mergedContent).toContain('Written entirely offline on a plane');
    expect(mergedContent).toContain('(verified)');
  });

  it('should converge TipTap XmlFragment(default) after simulated offline partition', () => {
    const online = new Y.Doc();
    const offline = new Y.Doc();

    seedParagraph(online, 'Shared opening line.');
    Y.applyUpdate(offline, Y.encodeStateAsUpdate(online));

    // Online peer keeps editing
    appendParagraph(online, 'Online addition while peer is partitioned.');

    // Offline peer edits independently (IndexedDB would hold this locally)
    appendParagraph(offline, 'Offline draft written without a network.');

    const svOnline = Y.encodeStateVector(online);
    const svOffline = Y.encodeStateVector(offline);

    Y.applyUpdate(offline, Y.encodeStateAsUpdate(online, svOffline));
    Y.applyUpdate(online, Y.encodeStateAsUpdate(offline, svOnline));

    expect(fragmentPlain(online)).toBe(fragmentPlain(offline));
    expect(fragmentPlain(online)).toContain('Shared opening line.');
    expect(fragmentPlain(online)).toContain('Online addition while peer is partitioned.');
    expect(fragmentPlain(online)).toContain('Offline draft written without a network.');
  });

  it('should restore XmlFragment state from encoded update snapshot (local ledger round-trip)', () => {
    const source = new Y.Doc();
    seedParagraph(source, 'Persisted folio body.');
    appendParagraph(source, 'Second block after refresh.');

    // Mimic IndexedDB / SQLite: encode full state, destroy memory, rehydrate
    const blob = Y.encodeStateAsUpdate(source);
    const restored = new Y.Doc();
    Y.applyUpdate(restored, blob);

    expect(fragmentPlain(restored)).toBe(fragmentPlain(source));
    expect(fragmentPlain(restored)).toContain('Persisted folio body.');
    expect(fragmentPlain(restored)).toContain('Second block after refresh.');
  });

  it('should persist updates to SQLite and restore via snapshot compaction', () => {
    const testDb = new Database(testDbPath);
    const testDocId = 'test-doc-compaction';
    testDb.createDocument(testDocId, 'Test Persistence Document');

    const sourceDoc = new Y.Doc();
    const fragment = sourceDoc.getXmlFragment('default');

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

    const watermark = testDb.getMaxUpdateId(testDocId);
    const compactedSnapshot = Y.encodeStateAsUpdate(sourceDoc);
    testDb.saveSnapshotAndPruneUpdates(testDocId, compactedSnapshot, watermark);

    expect(testDb.getUpdates(testDocId).length).toBe(0);

    const retrievedSnapshot = testDb.getSnapshot(testDocId);
    expect(retrievedSnapshot).not.toBeNull();

    const restoredDoc = new Y.Doc();
    Y.applyUpdate(restoredDoc, retrievedSnapshot!);

    expect(restoredDoc.getXmlFragment('default').toString()).toBe(
      sourceDoc.getXmlFragment('default').toString()
    );
  });

  it('should not drop concurrent updates during watermarked compaction', () => {
    const testDb = new Database(testDbPath);
    const testDocId = 'test-doc-race';
    testDb.createDocument(testDocId, 'Race Document');

    const sourceDoc = new Y.Doc();
    const text = sourceDoc.getText('content');

    sourceDoc.on('update', (update) => {
      testDb.saveUpdate(testDocId, update);
    });

    text.insert(0, 'base ');
    const watermark = testDb.getMaxUpdateId(testDocId);

    text.insert(text.length, 'concurrent');
    const concurrentMax = testDb.getMaxUpdateId(testDocId);
    expect(concurrentMax).toBeGreaterThan(watermark);

    const snapshot = Y.encodeStateAsUpdate(sourceDoc);
    testDb.saveSnapshotAndPruneUpdates(testDocId, snapshot, watermark);

    const remaining = testDb.getUpdates(testDocId);
    expect(remaining.length).toBeGreaterThanOrEqual(1);

    const restored = new Y.Doc();
    const snap = testDb.getSnapshot(testDocId)!;
    Y.applyUpdate(restored, snap);
    for (const u of remaining) {
      Y.applyUpdate(restored, u);
    }

    expect(restored.getText('content').toString()).toBe(sourceDoc.getText('content').toString());
    expect(restored.getText('content').toString()).toContain('concurrent');
  });

  it('should report accurate deleteDocument success', () => {
    const testDb = new Database(testDbPath);
    testDb.createDocument('to-delete', 'Temp');
    expect(testDb.deleteDocument('to-delete')).toBe(true);
    expect(testDb.deleteDocument('to-delete')).toBe(false);
    expect(testDb.getDocument('to-delete')).toBeNull();
  });
});
