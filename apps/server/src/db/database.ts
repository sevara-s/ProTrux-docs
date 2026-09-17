import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import type { DocumentAccessMode, DocumentMetadata } from '@protrux/shared';

type DocumentRow = {
  id: string;
  title: string;
  previewText?: string;
  createdAt: number | bigint;
  updatedAt: number | bigint;
  accessMode?: string;
  shareToken?: string | null;
  ownerKey?: string | null;
};

function newShareToken(): string {
  return randomBytes(12).toString('base64url');
}

function mapRow(row: DocumentRow): DocumentMetadata & { ownerKey?: string } {
  const accessMode = (row.accessMode as DocumentAccessMode) || 'edit';
  return {
    id: row.id,
    title: row.title,
    previewText: row.previewText || '',
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
    accessMode,
    shareToken: row.shareToken || undefined,
    ownerKey: row.ownerKey || undefined,
  };
}

const DOC_SELECT = `
  SELECT id, title, preview_text as previewText, created_at as createdAt, updated_at as updatedAt,
         access_mode as accessMode, share_token as shareToken, owner_key as ownerKey
  FROM documents
`;

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
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        preview_text TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

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

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_document_updates_document_id
      ON document_updates(document_id);
    `);

    // Access control columns (safe to re-run)
    try {
      this.db.exec(`ALTER TABLE documents ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'edit'`);
    } catch {
      /* already exists */
    }
    try {
      this.db.exec(`ALTER TABLE documents ADD COLUMN share_token TEXT`);
    } catch {
      /* already exists */
    }
    try {
      this.db.exec(`ALTER TABLE documents ADD COLUMN owner_key TEXT`);
    } catch {
      /* already exists */
    }

    this.seedDefaultDocumentIfEmpty();
  }

  private seedDefaultDocumentIfEmpty() {
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
    if (countRow.count === 0) {
      const defaultId = 'welcome-doc';
      const now = Date.now();
      const insert = this.db.prepare(`
        INSERT INTO documents (id, title, preview_text, created_at, updated_at, access_mode, share_token, owner_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        defaultId,
        'Welcome to ProTrux Collaborative Docs',
        'An authorial, local-first collaborative document engine with CRDT offline sync.',
        now,
        now,
        'edit',
        newShareToken(),
        null
      );
    }
  }

  public listDocuments(viewerOwnerKey?: string): DocumentMetadata[] {
    const stmt = this.db.prepare(`${DOC_SELECT} ORDER BY updated_at DESC`);
    const rows = stmt.all() as DocumentRow[];
    return rows
      .map(mapRow)
      .filter((doc) => {
        // Private: owner only
        if (doc.accessMode === 'private') {
          return !!viewerOwnerKey && doc.ownerKey === viewerOwnerKey;
        }
        // Library shows unowned rooms + docs you own.
        // Guests open shared rooms via the share link (`k`), not the library.
        if (!doc.ownerKey) return true;
        return !!viewerOwnerKey && doc.ownerKey === viewerOwnerKey;
      })
      .map((doc) => this.toPublic(doc, viewerOwnerKey));
  }

  public getDocument(id: string): (DocumentMetadata & { ownerKey?: string }) | null {
    const stmt = this.db.prepare(`${DOC_SELECT} WHERE id = ?`);
    const row = stmt.get(id) as DocumentRow | undefined;
    if (!row) return null;
    return mapRow(row);
  }

  /** Public-facing metadata — never leaks ownerKey; shareToken only for owner. */
  public toPublic(
    doc: DocumentMetadata & { ownerKey?: string },
    viewerOwnerKey?: string
  ): DocumentMetadata {
    const isOwner = !!(viewerOwnerKey && doc.ownerKey && viewerOwnerKey === doc.ownerKey);
    return {
      id: doc.id,
      title: doc.title,
      previewText: doc.previewText,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      accessMode: doc.accessMode || 'edit',
      shareToken: isOwner ? doc.shareToken : undefined,
      isOwner,
    };
  }

  public createDocument(
    id: string,
    title: string,
    previewText?: string,
    opts?: { ownerKey?: string; accessMode?: DocumentAccessMode }
  ): DocumentMetadata {
    const now = Date.now();
    const accessMode = opts?.accessMode || 'edit';
    const shareToken = newShareToken();
    const ownerKey = opts?.ownerKey || null;

    const stmt = this.db.prepare(`
      INSERT INTO documents (id, title, preview_text, created_at, updated_at, access_mode, share_token, owner_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, previewText || '', now, now, accessMode, shareToken, ownerKey);

    return this.toPublic(
      {
        id,
        title,
        previewText: previewText || '',
        createdAt: now,
        updatedAt: now,
        accessMode,
        shareToken,
        ownerKey: ownerKey || undefined,
      },
      ownerKey || undefined
    );
  }

  /** Assign owner when the document has none (legacy / welcome seed). */
  public claimOwnerIfEmpty(id: string, ownerKey: string): boolean {
    const doc = this.getDocument(id);
    if (!doc || doc.ownerKey) return false;
    const stmt = this.db.prepare(`
      UPDATE documents SET owner_key = ? WHERE id = ? AND (owner_key IS NULL OR owner_key = '')
    `);
    stmt.run(ownerKey, id);
    return true;
  }

  public updateDocument(
    id: string,
    data: { title?: string; previewText?: string; accessMode?: DocumentAccessMode }
  ): boolean {
    const doc = this.getDocument(id);
    if (!doc) return false;

    const newTitle = data.title !== undefined ? data.title : doc.title;
    const newPreview = data.previewText !== undefined ? data.previewText : doc.previewText;
    const newAccess = data.accessMode !== undefined ? data.accessMode : doc.accessMode || 'edit';
    const now = Date.now();

    const stmt = this.db.prepare(`
      UPDATE documents
      SET title = ?, preview_text = ?, access_mode = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(newTitle, newPreview || '', newAccess, now, id);
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
    const deleteAll = this.db.prepare(`
      DELETE FROM documents WHERE id = ?
    `);
    this.db.exec('BEGIN');
    try {
      this.db.prepare('DELETE FROM document_updates WHERE document_id = ?').run(id);
      this.db.prepare('DELETE FROM document_snapshots WHERE document_id = ?').run(id);
      const res = deleteAll.run(id) as { changes: number };
      this.db.exec('COMMIT');
      return Number(res?.changes ?? 0) > 0;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  public saveUpdate(documentId: string, updateData: Uint8Array) {
    const existing = this.getDocument(documentId);
    if (!existing) {
      throw new Error(`Cannot persist update for unknown document: ${documentId}`);
    }

    const now = Date.now();
    this.touchDocument(documentId);

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

  public getMaxUpdateId(documentId: string): number {
    const row = this.db
      .prepare(`SELECT COALESCE(MAX(id), 0) as maxId FROM document_updates WHERE document_id = ?`)
      .get(documentId) as { maxId: number | bigint } | undefined;
    return Number(row?.maxId ?? 0);
  }

  public saveSnapshotAndPruneUpdates(
    documentId: string,
    snapshotData: Uint8Array,
    maxUpdateId?: number
  ) {
    const now = Date.now();
    const watermark = maxUpdateId === undefined ? this.getMaxUpdateId(documentId) : maxUpdateId;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const upsert = this.db.prepare(`
        INSERT INTO document_snapshots (document_id, snapshot_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(document_id) DO UPDATE SET
          snapshot_data = excluded.snapshot_data,
          updated_at = excluded.updated_at
      `);
      upsert.run(documentId, snapshotData, now);

      if (watermark > 0) {
        this.db
          .prepare(`DELETE FROM document_updates WHERE document_id = ? AND id <= ?`)
          .run(documentId, watermark);
      }

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  public checkpoint() {
    this.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  }
}

export const db = new Database();
