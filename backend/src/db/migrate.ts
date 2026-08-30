import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config.js';
import { createDatabase } from './client.js';

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const migrationsFolder = fileURLToPath(
  new URL('../../migrations', import.meta.url)
);

try {
  await migrate(database.client, { migrationsFolder });
  console.info('Database migrations completed.');
} finally {
  await database.close();
}
