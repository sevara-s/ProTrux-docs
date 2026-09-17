import { FastifyInstance } from 'fastify';
import { normalizeDocId } from '@protrux/shared';
import { db } from '../db/database.js';
import { docs, destroyRoom } from '../crdt/persistence.js';
import * as Y from 'yjs';

export async function registerRoutes(app: FastifyInstance) {
  // Health check — verify SQLite is reachable
  app.get('/api/health', async (_req, reply) => {
    try {
      db.listDocuments();
    } catch (err) {
      return reply.status(503).send({
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'database unavailable',
        timestamp: Date.now(),
      });
    }

    let activeConnections = 0;
    docs.forEach((doc: any) => {
      activeConnections += doc.conns?.size ?? 0;
    });

    return {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      activeRooms: docs.size,
      activeConnections,
    };
  });

  app.get('/api/documents', async () => {
    const list = db.listDocuments();
    return list.map((item) => {
      const liveDoc = docs.get(item.id);
      return {
        ...item,
        activeUsersCount: liveDoc ? liveDoc.conns.size : 0,
      };
    });
  });

  app.get('/api/documents/:id', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const doc = db.getDocument(id);
    if (!doc) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    const liveDoc = docs.get(id);
    return {
      ...doc,
      activeUsersCount: liveDoc ? liveDoc.conns.size : 0,
    };
  });

  app.post('/api/documents', async (req, reply) => {
    const body = (req.body || {}) as { id?: string; title?: string };
    const title = (body.title || 'Untitled Document').trim().slice(0, 200);
    const id = normalizeDocId(
      body.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    );

    if (!title) {
      return reply.status(400).send({ error: 'Title is required' });
    }

    const existing = db.getDocument(id);
    if (existing) {
      return reply.status(409).send({ error: 'Document with this ID already exists' });
    }

    const created = db.createDocument(id, title);
    return reply.status(201).send(created);
  });

  app.patch('/api/documents/:id', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const body = (req.body || {}) as { title?: string; previewText?: string };

    if (body.title !== undefined) {
      body.title = body.title.trim().slice(0, 200);
      if (!body.title) {
        return reply.status(400).send({ error: 'Title cannot be empty' });
      }
    }

    const success = db.updateDocument(id, body);
    if (!success) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    return db.getDocument(id);
  });

  app.delete('/api/documents/:id', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);

    const existing = db.getDocument(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    // Close sockets + clear compaction timers before deleting rows
    destroyRoom(id);

    const deleted = db.deleteDocument(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    return { success: true, id };
  });

  app.get('/api/documents/:id/export', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const meta = db.getDocument(id);
    if (!meta) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    let ydoc = docs.get(id);
    let shouldDestroy = false;

    if (!ydoc) {
      ydoc = new Y.Doc();
      const snapshot = db.getSnapshot(id);
      if (snapshot) {
        Y.applyUpdate(ydoc, snapshot);
      }
      const updates = db.getUpdates(id);
      for (const update of updates) {
        Y.applyUpdate(ydoc, update);
      }
      shouldDestroy = true;
    }

    const fragment = ydoc.getXmlFragment('default');
    const rawXml = fragment.toString();
    const plainText = rawXml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (shouldDestroy) {
      ydoc.destroy();
    }

    return {
      id: meta.id,
      title: meta.title,
      updatedAt: meta.updatedAt,
      html: rawXml,
      markdown: plainText,
      plainText,
      rawXml,
    };
  });
}
