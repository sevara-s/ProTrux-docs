import path from 'node:path';
import fs from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { initCRDTPersistence, utils } from './crdt/persistence';
import { registerRoutes } from './api/routes';

const { setupWSConnection } = utils;

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = Fastify({
    logger: {
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

  // Enable CORS for web frontend
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Serve static assets if production build exists
  const webDistPath = path.resolve(__dirname, '../../apps/web/dist');
  const localDistPath = path.resolve(__dirname, '../web/dist');
  const targetDist = fs.existsSync(webDistPath) ? webDistPath : fs.existsSync(localDistPath) ? localDistPath : null;

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

  // Initialize SQLite-backed CRDT persistence engine
  initCRDTPersistence();

  // Register REST API endpoints
  await registerRoutes(app);

  // Bind WebSocket server to the underlying HTTP server
  const wss = new WebSocketServer({
    server: app.server,
  });

  wss.on('connection', (conn, req) => {
    try {
      const url = req.url || '';
      // Support patterns: /ws/:docName, /:docName, /ws?room=:docName
      let docName = 'welcome-doc';

      if (url.startsWith('/ws/')) {
        docName = url.slice(4).split('?')[0];
      } else if (url.startsWith('/ws?')) {
        const queryParams = new URLSearchParams(url.split('?')[1]);
        docName = queryParams.get('room') || queryParams.get('doc') || 'welcome-doc';
      } else if (url.length > 1 && !url.startsWith('/api')) {
        docName = url.slice(1).split('?')[0];
      }

      // Sanitize docName
      docName = decodeURIComponent(docName).replace(/[^a-zA-Z0-9-_]/g, '_');
      if (!docName) docName = 'welcome-doc';

      app.log.info({ docName }, 'Client connected to CRDT room');
      setupWSConnection(conn, req, { docName });
    } catch (err) {
      app.log.error({ err }, 'Error handling WebSocket connection');
      conn.close();
    }
  });

  // Start HTTP and WebSocket listening
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`🚀 ProTrux CRDT Server running on http://${HOST}:${PORT}`);
  app.log.info(`⚡ Real-time WebSocket endpoint available at ws://${HOST}:${PORT}/ws/:docName`);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Gracefully shutting down ProTrux Server...');
    wss.close();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
