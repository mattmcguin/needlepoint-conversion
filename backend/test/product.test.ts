import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppConfig } from '../src/config.js';
import type { ProductDatabase } from '../src/db/client.js';
import type { ProductNotifier } from '../src/notifications/telegram.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 3000,
  host: '127.0.0.1',
  databaseUrl: 'postgresql://unused',
  appOrigins: ['https://needlepointmaker.com'],
  dataRetentionDays: 365,
  reportToken: 'test-report-token-with-more-than-32-characters',
  logLevel: 'silent'
};

function createDatabase(): ProductDatabase {
  return {
    check: vi.fn(async () => undefined),
    insertAnalyticsEvents: vi.fn(async () => undefined),
    insertIntent: vi.fn(async () => undefined),
    insertFeedback: vi.fn(async () => undefined),
    getProductSummary: vi.fn(async (since) => ({
      since: since.toISOString(),
      events: [{ name: 'conversion_completed', count: 2 }],
      intent: [],
      feedback: [],
      acquisition: [
        { landingPage: '/', sessions: 3, convertedSessions: 2, exportedSessions: 1 }
      ]
    })),
    deleteProductDataBefore: vi.fn(async () => 0)
  };
}

function createNotifier(): ProductNotifier {
  return {
    notifyFeedback: vi.fn(async () => undefined),
    notifyIntent: vi.fn(async () => undefined)
  };
}

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('product measurement routes', () => {
  it('accepts an allow-listed event batch', async () => {
    const database = createDatabase();
    const app = buildApp({ config, database, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/events/batch',
      payload: {
        anonymousId: randomUUID(),
        sessionId: randomUUID(),
        events: [
          {
            eventId: randomUUID(),
            projectId: '123456789',
            eventName: 'conversion_completed',
            path: '/',
            properties: {
              mesh: 18,
              widthStitches: 72,
              heightStitches: 72,
              maxColors: 20,
              unitMode: 'inches',
              isEdit: false,
              colorCount: 18,
              durationBucket: '1_to_3s'
            },
            occurredAt: new Date().toISOString()
          }
        ]
      }
    });

    expect(response.statusCode).toBe(202);
    expect(database.insertAnalyticsEvents).toHaveBeenCalledOnce();
  });

  it('accepts a palette color change event without recording the colors', async () => {
    const database = createDatabase();
    const app = buildApp({ config, database, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/events/batch',
      payload: {
        anonymousId: randomUUID(),
        sessionId: randomUUID(),
        events: [
          {
            eventId: randomUUID(),
            projectId: '123456789',
            eventName: 'palette_color_changed',
            path: '/',
            properties: { source: 'legend' },
            occurredAt: new Date().toISOString()
          }
        ]
      }
    });

    expect(response.statusCode).toBe(202);
    expect(database.insertAnalyticsEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'palette_color_changed',
        properties: { source: 'legend' }
      })
    ]);
  });

  it('rejects unknown properties that could leak photo data', async () => {
    const database = createDatabase();
    const app = buildApp({ config, database, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/events/batch',
      payload: {
        anonymousId: randomUUID(),
        sessionId: randomUUID(),
        events: [
          {
            eventId: randomUUID(),
            eventName: 'image_selected',
            path: '/',
            properties: {
              fileType: 'jpeg',
              megapixelsBucket: '1_to_5',
              filename: 'private-family-photo.jpg'
            },
            occurredAt: new Date().toISOString()
          }
        ]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(database.insertAnalyticsEvents).not.toHaveBeenCalled();
  });

  it('accepts text/plain batches sent during page unload', async () => {
    const database = createDatabase();
    const app = buildApp({ config, database, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/events/batch',
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
      payload: JSON.stringify({
        anonymousId: randomUUID(),
        sessionId: randomUUID(),
        events: [
          {
            eventId: randomUUID(),
            eventName: 'page_view',
            path: '/',
            properties: { landingPage: '/', deviceClass: 'phone' },
            occurredAt: new Date().toISOString()
          }
        ]
      })
    });

    expect(response.statusCode).toBe(202);
    expect(database.insertAnalyticsEvents).toHaveBeenCalledOnce();
  });

  it('stores feedback consent independently from the message', async () => {
    const database = createDatabase();
    const notifier = createNotifier();
    const app = buildApp({ config, database, notifier, logger: false });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/feedback',
      payload: {
        anonymousId: randomUUID(),
        feedbackType: 'general',
        sentiment: 'positive',
        reasons: [],
        message: 'This made my first canvas much easier.',
        email: 'maker@example.com',
        followUpConsent: false,
        website: ''
      }
    });

    expect(response.statusCode).toBe(202);
    expect(database.insertFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maker@example.com',
        followUpConsent: false
      })
    );
    expect(notifier.notifyFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'This made my first canvas much easier.',
        email: 'maker@example.com'
      })
    );
  });

  it('notifies only for custom or commented feature intent', async () => {
    const database = createDatabase();
    const notifier = createNotifier();
    const app = buildApp({ config, database, notifier, logger: false });
    apps.push(app);

    const standardResponse = await app.inject({
      method: 'POST',
      url: '/v1/intent',
      payload: {
        anonymousId: randomUUID(),
        promptKey: 'post_conversion_features',
        selectedOption: 'printable_pdf',
        website: ''
      }
    });
    const customResponse = await app.inject({
      method: 'POST',
      url: '/v1/intent',
      payload: {
        anonymousId: randomUUID(),
        promptKey: 'post_conversion_features',
        selectedOption: 'other',
        optionalComment: 'A custom thread palette',
        website: ''
      }
    });

    expect(standardResponse.statusCode).toBe(202);
    expect(customResponse.statusCode).toBe(202);
    expect(notifier.notifyIntent).toHaveBeenCalledOnce();
    expect(notifier.notifyIntent).toHaveBeenCalledWith(
      expect.objectContaining({ optionalComment: 'A custom thread palette' })
    );
  });

  it('protects the aggregate report with a bearer token', async () => {
    const database = createDatabase();
    const app = buildApp({ config, database, logger: false });
    apps.push(app);

    const unauthorized = await app.inject({
      method: 'GET',
      url: '/v1/reports/summary?days=30'
    });
    const authorized = await app.inject({
      method: 'GET',
      url: '/v1/reports/summary?days=30',
      headers: { authorization: `Bearer ${config.reportToken}` }
    });

    expect(unauthorized.statusCode).toBe(401);
    expect(authorized.statusCode).toBe(200);
    expect(authorized.json().events).toEqual([
      { name: 'conversion_completed', count: 2 }
    ]);
    expect(authorized.json().acquisition).toEqual([
      { landingPage: '/', sessions: 3, convertedSessions: 2, exportedSessions: 1 }
    ]);
  });
});
