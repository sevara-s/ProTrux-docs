import { FastifyInstance } from 'fastify';
import { normalizeDocId, type DocumentAccessMode } from '@protrux/shared';
import { db } from '../db/database.js';
import { docs, destroyRoom } from '../crdt/persistence.js';
import * as Y from 'yjs';
import {
  readOwnerKey,
  readShareToken,
  canOpenDocument,
  canEditDocument,
} from '../access.js';

const ACCESS_MODES: DocumentAccessMode[] = ['private', 'view', 'edit'];

export async function registerRoutes(app: FastifyInstance) {
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
    docs.forEach((doc) => {
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

  app.get('/api/documents', async (req) => {
    const ownerKey = readOwnerKey(req);
    const list = db.listDocuments(ownerKey);
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
    const ownerKey = readOwnerKey(req);
    const shareToken = readShareToken(req);
    const raw = db.getDocument(id);
    if (!raw) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    if (!canOpenDocument(raw, ownerKey, shareToken)) {
      const privateDoc = (raw.accessMode || 'edit') === 'private';
      return reply.status(403).send({
        error: privateDoc ? 'This document is private' : 'Invalid share link',
        accessMode: raw.accessMode || 'edit',
      });
    }

    const liveDoc = docs.get(id);
    const pub = db.toPublic(raw, ownerKey);
    return {
      ...pub,
      canEdit: canEditDocument(raw, ownerKey),
      activeUsersCount: liveDoc ? liveDoc.conns.size : 0,
    };
  });

  app.post('/api/documents', async (req, reply) => {
    const body = (req.body || {}) as {
      id?: string;
      title?: string;
      accessMode?: DocumentAccessMode;
    };
    const title = (body.title || 'Untitled Document').trim().slice(0, 200);
    const id = normalizeDocId(
      body.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    );
    const ownerKey = readOwnerKey(req);
    const accessMode =
      body.accessMode && ACCESS_MODES.includes(body.accessMode) ? body.accessMode : 'edit';

    if (!title) {
      return reply.status(400).send({ error: 'Title is required' });
    }

    const existing = db.getDocument(id);
    if (existing) {
      return reply.status(409).send({ error: 'Document with this ID already exists' });
    }

    const created = db.createDocument(id, title, undefined, { ownerKey, accessMode });
    return reply.status(201).send({ ...created, canEdit: true });
  });

  app.patch('/api/documents/:id', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const ownerKey = readOwnerKey(req);
    const body = (req.body || {}) as {
      title?: string;
      previewText?: string;
      accessMode?: DocumentAccessMode;
    };

    const raw = db.getDocument(id);
    if (!raw) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    if (body.accessMode !== undefined) {
      if (!ACCESS_MODES.includes(body.accessMode)) {
        return reply.status(400).send({ error: 'Invalid access mode' });
      }
      if (!ownerKey) {
        return reply.status(403).send({ error: 'Only the owner can change access' });
      }
      if (!raw.ownerKey) {
        db.claimOwnerIfEmpty(id, ownerKey);
        raw.ownerKey = ownerKey;
      } else if (ownerKey !== raw.ownerKey) {
        return reply.status(403).send({ error: 'Only the owner can change access' });
      }
    }

    if (body.title !== undefined || body.previewText !== undefined) {
      if (!canEditDocument(raw, ownerKey)) {
        return reply.status(403).send({ error: 'Read-only document' });
      }
    }

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

    const updated = db.getDocument(id)!;
    return {
      ...db.toPublic(updated, ownerKey),
      canEdit: canEditDocument(updated, ownerKey),
    };
  });

  app.delete('/api/documents/:id', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const ownerKey = readOwnerKey(req);

    const existing = db.getDocument(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    if (existing.ownerKey && (!ownerKey || ownerKey !== existing.ownerKey)) {
      return reply.status(403).send({ error: 'Only the owner can delete this document' });
    }

    destroyRoom(id);

    const deleted = db.deleteDocument(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    return { success: true, id };
  });

  app.get('/api/documents/:id/export', async (req, reply) => {
    const id = normalizeDocId((req.params as { id: string }).id);
    const ownerKey = readOwnerKey(req);
    const shareToken = readShareToken(req);
    const meta = db.getDocument(id);
    if (!meta) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    if (!canOpenDocument(meta, ownerKey, shareToken)) {
      return reply.status(403).send({
        error: (meta.accessMode || 'edit') === 'private' ? 'This document is private' : 'Invalid share link',
      });
    }

    const live = docs.get(id);
    let exportDoc: Y.Doc;
    let shouldDestroy = false;

    if (live) {
      exportDoc = live;
    } else {
      exportDoc = new Y.Doc();
      const snapshot = db.getSnapshot(id);
      if (snapshot) {
        Y.applyUpdate(exportDoc, snapshot);
      }
      const updates = db.getUpdates(id);
      for (const update of updates) {
        Y.applyUpdate(exportDoc, update);
      }
      shouldDestroy = true;
    }

    const fragment = exportDoc.getXmlFragment('default');
    const rawXml = fragment.toString();
    const plainText = rawXml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (shouldDestroy) {
      exportDoc.destroy();
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
