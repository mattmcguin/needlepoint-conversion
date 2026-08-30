import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export interface HealthDatabase {
  check(): Promise<void>;
}

export interface AnalyticsEventRecord {
  eventId: string;
  anonymousId: string;
  sessionId: string;
  projectId?: string | undefined;
  eventName: string;
  path: string;
  properties: Record<string, unknown>;
  occurredAt: Date;
}

export interface IntentRecord {
  anonymousId: string;
  projectId?: string | undefined;
  promptKey: string;
  selectedOption: string;
  optionalComment?: string | undefined;
}

export interface FeedbackRecord {
  anonymousId: string;
  projectId?: string | undefined;
  feedbackType: string;
  sentiment?: string | undefined;
  reasons: string[];
  message?: string | undefined;
  email?: string | undefined;
  followUpConsent: boolean;
}

export interface ProductSummary {
  since: string;
  events: Array<{ name: string; count: number }>;
  intent: Array<{ promptKey: string; option: string; count: number }>;
  feedback: Array<{ type: string; sentiment: string | null; count: number }>;
}

export interface ProductDatabase extends HealthDatabase {
  insertAnalyticsEvents(events: AnalyticsEventRecord[]): Promise<void>;
  insertIntent(intent: IntentRecord): Promise<void>;
  insertFeedback(feedback: FeedbackRecord): Promise<void>;
  getProductSummary(since: Date): Promise<ProductSummary>;
  deleteProductDataBefore(cutoff: Date): Promise<number>;
}

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });

  const client = drizzle(pool, { schema });

  return {
    client,
    async check(): Promise<void> {
      await pool.query('select 1');
    },
    async insertAnalyticsEvents(events: AnalyticsEventRecord[]): Promise<void> {
      if (events.length === 0) return;
      await client
        .insert(schema.analyticsEvents)
        .values(events)
        .onConflictDoNothing({ target: schema.analyticsEvents.eventId });
    },
    async insertIntent(intent: IntentRecord): Promise<void> {
      await client.insert(schema.intentResponses).values(intent);
    },
    async insertFeedback(feedback: FeedbackRecord): Promise<void> {
      await client.insert(schema.feedback).values(feedback);
    },
    async getProductSummary(since: Date): Promise<ProductSummary> {
      const [eventsResult, intentResult, feedbackResult] = await Promise.all([
        pool.query<{ name: string; count: string }>(
          `select event_name as name, count(*)::text as count
           from analytics_events
           where created_at >= $1
           group by event_name
           order by event_name`,
          [since]
        ),
        pool.query<{ prompt_key: string; option: string; count: string }>(
          `select prompt_key, selected_option as option, count(*)::text as count
           from intent_responses
           where created_at >= $1
           group by prompt_key, selected_option
           order by prompt_key, selected_option`,
          [since]
        ),
        pool.query<{
          type: string;
          sentiment: string | null;
          count: string;
        }>(
          `select feedback_type as type, sentiment, count(*)::text as count
           from feedback
           where created_at >= $1
           group by feedback_type, sentiment
           order by feedback_type, sentiment`,
          [since]
        )
      ]);

      return {
        since: since.toISOString(),
        events: eventsResult.rows.map((row) => ({
          name: row.name,
          count: Number(row.count)
        })),
        intent: intentResult.rows.map((row) => ({
          promptKey: row.prompt_key,
          option: row.option,
          count: Number(row.count)
        })),
        feedback: feedbackResult.rows.map((row) => ({
          type: row.type,
          sentiment: row.sentiment,
          count: Number(row.count)
        }))
      };
    },
    async deleteProductDataBefore(cutoff: Date): Promise<number> {
      const result = await pool.query<{ deleted_count: string }>(
        `with deleted_events as (
           delete from analytics_events where created_at < $1 returning 1
         ), deleted_intent as (
           delete from intent_responses where created_at < $1 returning 1
         ), deleted_feedback as (
           delete from feedback where created_at < $1 returning 1
         )
         select (
           (select count(*) from deleted_events) +
           (select count(*) from deleted_intent) +
           (select count(*) from deleted_feedback)
         )::text as deleted_count`,
        [cutoff]
      );
      return Number(result.rows[0]?.deleted_count ?? 0);
    },
    async close(): Promise<void> {
      await pool.end();
    }
  };
}

export type Database = ReturnType<typeof createDatabase>;
