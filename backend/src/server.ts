import 'dotenv/config';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const app = buildApp({ config, database });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Shutting down');
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
} catch (error) {
  app.log.fatal({ error }, 'Unable to start backend');
  await database.close();
  process.exit(1);
}
