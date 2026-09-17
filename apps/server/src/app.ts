import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { normalizeDocId } from '@protrux/shared';
import { initCRDTPersistence, flushAllRooms } from './crdt/persistence.js';
import { setupWSConnection } from './crdt/y-websocket-utils.js';
import { installReadOnlyMessageFilter } from './crdt/ws-readonly.js';
import { registerRoutes } from './api/routes.js';
import { db } from './db/database.js';
import {
  readOwnerKeyFromUrl,
  readShareToken,
  resolveWsAccess,
} from './access.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type BuildAppOptions = {
  logger?: boolean | object;
  serveStatic?: boolean;
};

export async function buildApp(opts: BuildAppOptions = {}): Promise<{
  app: FastifyInstance;
  wss: WebSocketServer;
  shutdown: (signal?: string) => Promise<void>;
}> {
  const isProd = process.env.NODE_ENV === 'production';
  const app = Fastify({
    logger:
      opts.logger === false
        ? false
        : opts.logger ??
          (isProd
            ? { level: process.env.LOG_LEVEL || 'info' }
            : {
                level: process.env.LOG_LEVEL || 'info',
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    translateTime: 'SYS:standard',
                  },
                },
              }),
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  if (opts.serveStatic !== false) {
    const candidateDists = [
      path.resolve(__dirname, '../../web/dist'),
      path.resolve(__dirname, '../../../apps/web/dist'),
      path.resolve(process.cwd(), 'apps/web/dist'),
      path.resolve(process.cwd(), 'web/dist'),
    ];
    const targetDist = candidateDists.find((p) => fs.existsSync(p)) || null;

    if (targetDist) {
      const fastifyStatic = (await import('@fastify/static')).default;
      await app.register(fastifyStatic, {
        root: targetDist,
        prefix: '/',
      });
      app.setNotFoundHandler((req, reply) => {
        if (req.raw.url && !req.raw.url.startsWith('/api') && !req.raw.url.startsWith('/ws')) {
          return reply.sendFile('index.html');
        }
        return reply.status(404).send({ error: 'Not Found' });
      });
    }
  }

  initCRDTPersistence();
  await registerRoutes(app);

  // Ensure server is ready so app.server exists for ws
  await app.ready();
  const wss = new WebSocketServer({ server: app.server });

  wss.on('connection', (conn, req) => {
    try {
      const url = req.url || '';
      if (url.startsWith('/api')) {
        conn.close(1008, 'Invalid WebSocket path');
        return;
      }

      let rawName = 'welcome-doc';

      if (url.startsWith('/ws/')) {
        rawName = url.slice(4).split('?')[0];
      } else if (url.startsWith('/ws?') || url === '/ws') {
        const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
        rawName = queryParams.get('room') || queryParams.get('doc') || 'welcome-doc';
      } else if (url.length > 1 && !url.startsWith('/api')) {
        rawName = url.slice(1).split('?')[0];
      }

      const docName = normalizeDocId(decodeURIComponent(rawName));
      const ownerKey = readOwnerKeyFromUrl(url);
      const shareToken = readShareToken({ url });
      const meta = db.getDocument(docName);
      const access = resolveWsAccess(meta, ownerKey, shareToken);

      if (!access.canOpen) {
        app.log.warn({ docName, reason: access.reason }, 'WebSocket ACL rejected');
        conn.close(1008, access.reason || 'Forbidden');
        return;
      }

      app.log.info({ docName, canEdit: access.canEdit }, 'Client connected to CRDT room');
      setupWSConnection(conn, req, { docName });

      if (!access.canEdit) {
        installReadOnlyMessageFilter(conn);
      }
    } catch (err) {
      app.log.error({ err }, 'Error handling WebSocket connection');
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
  });

  let shuttingDown = false;
  const shutdown = async (signal = 'shutdown') => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'Gracefully shutting down ProTrux Server...');

    try {
      await flushAllRooms();
    } catch (err) {
      app.log.error({ err }, 'Error flushing CRDT rooms');
    }

    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await app.close();

    try {
      db.checkpoint();
    } catch {
      // ignore
    }
  };

  return { app, wss, shutdown };
}
