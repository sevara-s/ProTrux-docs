import { describe, it, expect, afterEach } from 'vitest';
import { db } from '../apps/server/src/db/database';
import Fastify from 'fastify';
import { registerRoutes } from '../apps/server/src/api/routes';
import fs from 'node:fs';
import path from 'node:path';
import { Database } from '../apps/server/src/db/database';

async function withApp() {
  const app = Fastify({ logger: false });
  await registerRoutes(app);
  await app.ready();
  return app;
}

describe('REST document access', () => {
  const ids: string[] = [];

  afterEach(() => {
    for (const id of ids.splice(0)) {
      try {
        db.deleteDocument(id);
      } catch {
        // ignore
      }
    }
  });

  it('creates a document for the owner and returns canEdit', async () => {
    const app = await withApp();
    const id = `test-rest-${Date.now()}`;
    ids.push(id);

    const res = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { 'x-owner-key': 'owner-rest-1', 'content-type': 'application/json' },
      payload: { id, title: 'ACL REST Doc', accessMode: 'private' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBe(id);
    expect(body.canEdit).toBe(true);
    expect(body.isOwner).toBe(true);
    expect(body.shareToken).toBeTruthy();

    await app.close();
  });

  it('rejects strangers on private documents', async () => {
    const app = await withApp();
    const id = `test-priv-${Date.now()}`;
    ids.push(id);

    await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { 'x-owner-key': 'owner-rest-2', 'content-type': 'application/json' },
      payload: { id, title: 'Secret', accessMode: 'private' },
    });

    const denied = await app.inject({
      method: 'GET',
      url: `/api/documents/${id}`,
      headers: { 'x-owner-key': 'intruder' },
    });
    expect(denied.statusCode).toBe(403);

    const allowed = await app.inject({
      method: 'GET',
      url: `/api/documents/${id}`,
      headers: { 'x-owner-key': 'owner-rest-2' },
    });
    expect(allowed.statusCode).toBe(200);

    await app.close();
  });

  it('allows guests with a valid share token on edit docs', async () => {
    const app = await withApp();
    const id = `test-share-${Date.now()}`;
    ids.push(id);

    const created = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { 'x-owner-key': 'owner-rest-3', 'content-type': 'application/json' },
      payload: { id, title: 'Shared', accessMode: 'edit' },
    });
    const token = created.json().shareToken as string;

    // Edit mode: doc link alone is enough (simultaneous collab)
    const byId = await app.inject({
      method: 'GET',
      url: `/api/documents/${id}`,
      headers: { 'x-owner-key': 'guest' },
    });
    expect(byId.statusCode).toBe(200);
    expect(byId.json().canEdit).toBe(true);

    const withTok = await app.inject({
      method: 'GET',
      url: `/api/documents/${id}?k=${encodeURIComponent(token)}`,
      headers: { 'x-owner-key': 'guest' },
    });
    expect(withTok.statusCode).toBe(200);
    expect(withTok.json().canEdit).toBe(true);

    const wrongTok = await app.inject({
      method: 'GET',
      url: `/api/documents/${id}?k=wrong-token`,
      headers: { 'x-owner-key': 'guest' },
    });
    expect(wrongTok.statusCode).toBe(403);

    await app.close();
  });

  it('blocks title edits on view-mode documents for non-owners', async () => {
    const app = await withApp();
    const id = `test-view-${Date.now()}`;
    ids.push(id);

    await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { 'x-owner-key': 'owner-rest-4', 'content-type': 'application/json' },
      payload: { id, title: 'Read only', accessMode: 'view' },
    });

    const guestPatch = await app.inject({
      method: 'PATCH',
      url: `/api/documents/${id}`,
      headers: { 'x-owner-key': 'guest', 'content-type': 'application/json' },
      payload: { title: 'Hijacked' },
    });
    expect(guestPatch.statusCode).toBe(403);

    await app.close();
  });
});

describe('Database library visibility', () => {
  const testDbPath = path.resolve(__dirname, '../data/test-acl-list.sqlite');

  afterEach(() => {
    for (const suffix of ['', '-wal', '-shm']) {
      const p = testDbPath + suffix;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  it('lists only own + unowned documents for a viewer', () => {
    for (const suffix of ['', '-wal', '-shm']) {
      const p = testDbPath + suffix;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    const local = new Database(testDbPath);
    local.createDocument('a', 'Mine', undefined, { ownerKey: 'u1', accessMode: 'edit' });
    local.createDocument('b', 'Theirs', undefined, { ownerKey: 'u2', accessMode: 'edit' });
    local.createDocument('c', 'Orphan', undefined, { accessMode: 'edit' });

    const listed = local.listDocuments('u1').map((d) => d.id);
    expect(listed).toContain('a');
    expect(listed).toContain('c');
    expect(listed).not.toContain('b');
  });
});
