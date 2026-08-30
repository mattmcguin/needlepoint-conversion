import 'dotenv/config';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const app = buildApp({ config, database });
const RETENTION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function cleanupExpiredProductData(): Promise<void> {
  const cutoff = new Date(Date.now() - config.dataRetentionDays * 86_400_000);
  try {
    const deleted = await database.deleteProductDataBefore(cutoff);
    app.log.info(
      { cutoff: cutoff.toISOString(), deleted },
      'Product data retention cleanup complete'
    );
  } catch (error) {
    app.log.error({ error }, 'Product data retention cleanup failed');
  }
}

const retentionCleanupTimer = setInterval(() => {
  void cleanupExpiredProductData();
}, RETENTION_CLEANUP_INTERVAL_MS);
retentionCleanupTimer.unref();

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Shutting down');
  clearInterval(retentionCleanupTimer);
  await app.close();
  await database.close();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        app.log.error({ error }, 'Graceful shutdown failed');
        process.exit(1);
      });
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
  void cleanupExpiredProductData();
} catch (error) {
  app.log.fatal({ error }, 'Unable to start backend');
  await database.close();
  process.exit(1);
}
