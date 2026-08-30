import 'dotenv/config';
import { loadConfig } from '../config.js';
import { createDatabase } from './client.js';

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const cutoff = new Date(Date.now() - config.dataRetentionDays * 86_400_000);

try {
  const deleted = await database.deleteProductDataBefore(cutoff);
  console.info(
    JSON.stringify({
      message: 'Product data retention cleanup complete',
      cutoff: cutoff.toISOString(),
      deleted
    })
  );
} finally {
  await database.close();
}
