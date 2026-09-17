import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { normalizeDocId } from '@protrux/shared';
import { initCRDTPersistence, utils, flushAllRooms } from './crdt/persistence.js';
import { registerRoutes } from './api/routes.js';
import { db } from './db/database.js';

const { setupWSConnection } = utils;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = Fastify({
    logger: isProd
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
        },
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

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

  initCRDTPersistence();
  await registerRoutes(app);

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

      const docName = normalizeDocId(rawName);
      app.log.info({ docName }, 'Client connected to CRDT room');
      setupWSConnection(conn, req, { docName });
    } catch (err) {
      app.log.error({ err }, 'Error handling WebSocket connection');
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
  });

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`ProTrux CRDT Server running on http://${HOST}:${PORT}`);
  app.log.info(`WebSocket endpoint: ws://${HOST}:${PORT}/ws/:docName`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
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

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
