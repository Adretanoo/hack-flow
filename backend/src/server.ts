import { buildApp } from './app';
import { env } from './config/env';
import { createDatabaseConnection, closeDatabaseConnection } from './config/database';
import { createRedisClient, closeRedisClient } from './config/redis';
import { logger } from './utils/logger';

async function start(): Promise<void> {
  // Initialise infrastructure connections
  createDatabaseConnection();
  createRedisClient();

  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    await app.close();
    await closeDatabaseConnection();
    await closeRedisClient();
    logger.info('Server stopped gracefully');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`🚀 Server listening on http://${env.HOST}:${env.PORT}`);
    logger.info(`📚 Swagger docs at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

void start();
