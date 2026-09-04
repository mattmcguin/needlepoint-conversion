import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppConfig } from '../src/config.js';
import type { ProductDatabase } from '../src/db/client.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 3000,
  host: '127.0.0.1',
  databaseUrl: 'postgresql://unused',
  appOrigins: ['https://needlepointmaker.com'],
  dataRetentionDays: 365,
  logLevel: 'silent'
};

const apps: ReturnType<typeof buildApp>[] = [];

function databaseWithCheck(check: ProductDatabase['check']): ProductDatabase {
  return {
    check,
    insertAnalyticsEvents: vi.fn(async () => undefined),
    insertIntent: vi.fn(async () => undefined),
    insertFeedback: vi.fn(async () => undefined),
    getVisitorActivity: vi.fn(async () => ({
      conversions: 0,
      exports: 0,
      progressMarks: 0,
      sessions: 0
    })),
    getProductSummary: vi.fn(async (since) => ({
      since: since.toISOString(),
      events: [],
      intent: [],
      feedback: [],
      acquisition: [],
      exports: [],
      devices: [],
      outcomes: []
    })),
    deleteProductDataBefore: vi.fn(async () => 0)
  };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('health routes', () => {
  it('reports process liveness without querying the database', async () => {
    const check = vi.fn(async () => undefined);
    const app = buildApp({ config, database: databaseWithCheck(check), logger: false });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(check).not.toHaveBeenCalled();
  });

  it('reports readiness when the database responds', async () => {
    const check = vi.fn(async () => undefined);
    const app = buildApp({ config, database: databaseWithCheck(check), logger: false });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
    expect(check).toHaveBeenCalledOnce();
  });

  it('returns 503 when the database is unavailable', async () => {
    const app = buildApp({
      config,
      database: databaseWithCheck(
        vi.fn(async () => {
          throw new Error('database unavailable');
        })
      ),
      logger: false
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
  });
});
