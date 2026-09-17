import { buildApp } from './app.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const { app, shutdown } = await buildApp();

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`ProTrux CRDT Server running on http://${HOST}:${PORT}`);
  app.log.info(`WebSocket endpoint: ws://${HOST}:${PORT}/ws/:docName`);

  process.on('SIGINT', () => void shutdown('SIGINT').then(() => process.exit(0)));
  process.on('SIGTERM', () => void shutdown('SIGTERM').then(() => process.exit(0)));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
