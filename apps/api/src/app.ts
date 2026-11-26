import bootstrap from '@/bootstrap';
import config from '@/config/config';
import { prisma } from '@/infrastructure/database/prisma/prisma';
import { sseManager } from '@/infrastructure/event-stream/sse-manager';
import { closeSSERedisBridge } from '@/infrastructure/event-stream/sse-redis-bridge';
import { closeRedisConnection } from '@/infrastructure/redis/redis-connection';
import 'dotenv/config';
import express, { Express } from 'express';
import * as http from 'http';

const PORT = config.app.port || 8000;

(async () => {
  const app: Express = express();
  const httpServer = http.createServer(app);

  await bootstrap(app);
  console.log('✅  Success connected to all resources.');

  const server = httpServer.listen(PORT, () => console.log(`✅  Listening on port: ${PORT}`));
  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('Shutting down gracefully...');

    const serverClosed = new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    sseManager.closeAll();

    try {
      await serverClosed;
    } catch (error) {
      console.error('Failed to close HTTP server:', error);
      process.exitCode = 1;
    }

    const results = await Promise.allSettled([
      closeSSERedisBridge(),
      closeRedisConnection(),
      prisma.$disconnect(),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Failed to close a connection:', result.reason);
        process.exitCode = 1;
      }
    }
  };

  process.on('SIGTERM', shutdown); // sinyal dari Docker/K8s saat stop container
  process.on('SIGINT', shutdown); // sinyal dari Ctrl+C waktu dev
})();
