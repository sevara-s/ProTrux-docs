import { FastifyInstance } from 'fastify';
import { db } from '../db/database';
import { docs } from '../crdt/persistence';
import * as Y from 'yjs';

export async function registerRoutes(app: FastifyInstance) {
  // Health check
  app.get('/api/health', async () => {
    let activeConnections = 0;
    docs.forEach((doc: any) => {
      activeConnections += doc.conns.size;
    });

    return {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      activeRooms: docs.size,
      activeConnections,
    };
  });

  // List all documents
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

  // Get specific document metadata
  app.get('/api/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
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

  // Create new document
  app.post('/api/documents', async (req, reply) => {
    const body = req.body as { id?: string; title?: string };
    const title = (body.title || 'Untitled Document').trim();
    const id = (body.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`).trim();

    const existing = db.getDocument(id);
    if (existing) {
      return reply.status(409).send({ error: 'Document with this ID already exists' });
    }

    const created = db.createDocument(id, title);
    return reply.status(201).send(created);
  });

  // Update document metadata (title, preview)
  app.patch('/api/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { title?: string; previewText?: string };

    const success = db.updateDocument(id, body);
    if (!success) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    return db.getDocument(id);
  });

  // Delete document
  app.delete('/api/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    
    // If loaded in memory, destroy it
    const liveDoc = docs.get(id);
    if (liveDoc) {
      liveDoc.destroy();
      docs.delete(id);
    }

    const deleted = db.deleteDocument(id);
    return { success: deleted, id };
  });

  // Export document content
  app.get('/api/documents/:id/export', async (req, reply) => {
    const { id } = req.params as { id: string };
    const meta = db.getDocument(id);
    if (!meta) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    // Read Yjs document representation
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
      rawXml,
      plainText,
    };
  });
}
