import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_DOCUMENT_CONTENT, DocumentMetadata } from '@protrux/shared';

export class Database {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const defaultDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }

    const resolvedPath = dbPath || path.join(defaultDir, 'protrux.sqlite');
    this.db = new DatabaseSync(resolvedPath);

    this.init();
  }

  private init() {
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA synchronous = NORMAL;');

    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        preview_text TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Document snapshots table (compacted binary CRDT state)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_snapshots (
        document_id TEXT PRIMARY KEY,
        snapshot_data BLOB NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

 
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        update_data BLOB NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

    this.seedDefaultDocumentIfEmpty();
  }

  private seedDefaultDocumentIfEmpty() {
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
    if (countRow.count === 0) {
      const defaultId = 'welcome-doc';
      const now = Date.now();
      const insert = this.db.prepare(`
        INSERT INTO documents (id, title, preview_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      insert.run(
        defaultId,
        'Welcome to ProTrux Collaborative Docs',
        'An authorial, local-first collaborative document engine with CRDT offline sync.',
        now,
        now
      );
    }
  }

  public listDocuments(): DocumentMetadata[] {
    const stmt = this.db.prepare(`
      SELECT id, title, preview_text as previewText, created_at as createdAt, updated_at as updatedAt
      FROM documents
      ORDER BY updated_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      previewText: r.previewText,
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    }));
  }

  public getDocument(id: string): DocumentMetadata | null {
    const stmt = this.db.prepare(`
      SELECT id, title, preview_text as previewText, created_at as createdAt, updated_at as updatedAt
      FROM documents
      WHERE id = ?
    `);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      previewText: row.previewText,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    };
  }

  public createDocument(id: string, title: string, previewText?: string): DocumentMetadata {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, title, preview_text, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, previewText || '', now, now);
    return {
      id,
      title,
      previewText,
      createdAt: now,
      updatedAt: now,
    };
  }

  public updateDocument(id: string, data: { title?: string; previewText?: string }): boolean {
    const doc = this.getDocument(id);
    if (!doc) return false;

    const newTitle = data.title !== undefined ? data.title : doc.title;
    const newPreview = data.previewText !== undefined ? data.previewText : doc.previewText;
    const now = Date.now();

    const stmt = this.db.prepare(`
      UPDATE documents
      SET title = ?, preview_text = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(newTitle, newPreview || '', now, id);
    return true;
  }

  public touchDocument(id: string) {
    const stmt = this.db.prepare(`
      UPDATE documents
      SET updated_at = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), id);
  }

  public deleteDocument(id: string): boolean {
    // Delete updates and snapshot
    this.db.prepare('DELETE FROM document_updates WHERE document_id = ?').run(id);
    this.db.prepare('DELETE FROM document_snapshots WHERE document_id = ?').run(id);
    const res = this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return (res as any)?.changes > 0 || true;
  }

  public saveUpdate(documentId: string, updateData: Uint8Array) {
    // Check if doc exists in metadata, if not create automatically
    const existing = this.getDocument(documentId);
    const now = Date.now();
    if (!existing) {
      const readableTitle = documentId
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      this.createDocument(documentId, readableTitle);
    } else {
      this.touchDocument(documentId);
    }

    const stmt = this.db.prepare(`
      INSERT INTO document_updates (document_id, update_data, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(documentId, updateData, now);
  }

  public getUpdates(documentId: string): Uint8Array[] {
    const stmt = this.db.prepare(`
      SELECT update_data as updateData
      FROM document_updates
      WHERE document_id = ?
      ORDER BY id ASC
    `);
    const rows = stmt.all(documentId) as any[];
    return rows.map((r) => new Uint8Array(r.updateData));
  }

  public getSnapshot(documentId: string): Uint8Array | null {
    const stmt = this.db.prepare(`
      SELECT snapshot_data as snapshotData
      FROM document_snapshots
      WHERE document_id = ?
    `);
    const row = stmt.get(documentId) as any;
    if (!row) return null;
    return new Uint8Array(row.snapshotData);
  }

  public saveSnapshotAndPruneUpdates(documentId: string, snapshotData: Uint8Array) {
    const now = Date.now();
    // Upsert snapshot
    const upsert = this.db.prepare(`
      INSERT INTO document_snapshots (document_id, snapshot_data, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        snapshot_data = excluded.snapshot_data,
        updated_at = excluded.updated_at
    `);
    upsert.run(documentId, snapshotData, now);

    // Prune incremental updates that have been compacted into the snapshot
    this.db.prepare('DELETE FROM document_updates WHERE document_id = ?').run(documentId);
  }
}

export const db = new Database();
