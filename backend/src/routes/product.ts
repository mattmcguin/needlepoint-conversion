import { timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type {
  AnalyticsEventRecord,
  ProductDatabase
} from '../db/client.js';
import type { ProductNotifier } from '../notifications/telegram.js';

const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const projectId = identifier.optional();
const path = z
  .string()
  .max(200)
  .regex(/^\/[A-Za-z0-9/_-]*$/);

const acquisitionProperties = {
  landingPage: path.optional(),
  referrerDomain: z.string().max(120).regex(/^[A-Za-z0-9.-]+$/).optional(),
  utmSource: z.string().max(80).regex(/^[A-Za-z0-9._-]+$/).optional(),
  utmMedium: z.string().max(80).regex(/^[A-Za-z0-9._-]+$/).optional(),
  utmCampaign: z.string().max(100).regex(/^[A-Za-z0-9._-]+$/).optional(),
  deviceClass: z.enum(['phone', 'tablet', 'desktop']).optional()
};

const conversionProperties = {
  mesh: z.number().int().min(8).max(24),
  widthStitches: z.number().int().positive().max(500),
  heightStitches: z.number().int().positive().max(500),
  maxColors: z.number().int().min(2).max(64),
  unitMode: z.enum(['inches', 'stitches']),
  isEdit: z.boolean()
};

const eventProperties = {
  page_view: z.object(acquisitionProperties).strict(),
  image_selected: z
    .object({
      fileType: z.enum(['jpeg', 'png', 'webp', 'gif', 'heic', 'other']),
      megapixelsBucket: z.enum(['under_1', '1_to_5', '5_to_12', 'over_12'])
    })
    .strict(),
  conversion_started: z.object(conversionProperties).strict(),
  conversion_completed: z
    .object({
      ...conversionProperties,
      colorCount: z.number().int().min(1).max(64),
      durationBucket: z.enum(['under_1s', '1_to_3s', '3_to_10s', 'over_10s'])
    })
    .strict(),
  conversion_failed: z
    .object({
      stage: z.enum(['validation', 'processing', 'storage']),
      errorCode: z.enum(['invalid_dimensions', 'processing_failed', 'storage_full'])
    })
    .strict(),
  project_opened: z.object({ source: z.enum(['sidebar', 'recent']) }).strict(),
  export_clicked: z
    .object({ exportType: z.enum(['grid_csv', 'legend_csv', 'preview_png', 'grid_png']) })
    .strict(),
  progress_marked: z
    .object({
      completedPercentBucket: z.enum(['under_1', '1_to_24', '25_to_49', '50_to_74', '75_to_99', '100'])
    })
    .strict(),
  intent_prompt_viewed: z.object({ promptKey: z.literal('post_conversion_features') }).strict(),
  intent_prompt_dismissed: z.object({ promptKey: z.literal('post_conversion_features') }).strict(),
  outcome_prompt_viewed: z.object({ promptKey: z.literal('post_export_ready') }).strict(),
  outcome_prompt_responded: z
    .object({ promptKey: z.literal('post_export_ready'), response: z.enum(['yes', 'not_yet']) })
    .strict(),
  feedback_opened: z.object({ placement: z.enum(['sidebar', 'intent', 'outcome']) }).strict()
} as const;

type EventName = keyof typeof eventProperties;

const eventEnvelopeSchema = z
  .object({
    eventId: z.uuid(),
    projectId,
    eventName: z.enum(Object.keys(eventProperties) as [EventName, ...EventName[]]),
    path,
    properties: z.record(z.string(), z.unknown()),
    occurredAt: z.iso.datetime()
  })
  .strict();

const eventBatchSchema = z
  .object({
    anonymousId: identifier,
    sessionId: identifier,
    events: z.array(eventEnvelopeSchema).min(1).max(20)
  })
  .strict();

const intentSchema = z
  .object({
    anonymousId: identifier,
    projectId,
    promptKey: z.literal('post_conversion_features'),
    selectedOption: z.enum([
      'printable_pdf',
      'thread_matching',
      'pattern_cleanup',
      'cloud_sync',
      'physical_canvas',
      'other',
      'none'
    ]),
    optionalComment: z.string().trim().max(500).optional(),
    website: z.string().max(200).optional()
  })
  .strict();

const feedbackSchema = z
  .object({
    anonymousId: identifier,
    projectId,
    feedbackType: z.enum(['general', 'conversion', 'export', 'progress']),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    reasons: z
      .array(
        z.enum([
          'hard_to_use',
          'pattern_quality',
          'missing_export',
          'missing_thread_colors',
          'progress_tracking',
          'other'
        ])
      )
      .max(6)
      .default([]),
    message: z.string().trim().max(2_000).optional(),
    email: z.email().max(320).optional(),
    followUpConsent: z.boolean().default(false),
    website: z.string().max(200).optional()
  })
  .strict()
  .refine(
    (value) => Boolean(value.sentiment || value.reasons.length || value.message),
    { message: 'Provide a rating, reason, or message' }
  )
  .refine((value) => !value.followUpConsent || Boolean(value.email), {
    message: 'Email is required when follow-up consent is selected'
  });

function validationError(reply: FastifyReply, issues: z.core.$ZodIssue[]) {
  return reply.code(400).send({
    error: 'invalid_request',
    details: issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  });
}

function parseBeaconBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch (_error) {
    return body;
  }
}

function hasValidReportToken(header: string | undefined, expected: string): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  const received = header.slice('Bearer '.length);
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

interface ProductRouteOptions {
  database: ProductDatabase;
  notifier?: ProductNotifier;
  reportToken?: string;
}

function notifyInBackground(
  notification: Promise<void>,
  logger: { warn(bindings: object, message: string): void },
  notificationType: 'feedback' | 'intent'
): void {
  void notification.catch((error: unknown) => {
    logger.warn({ error, notificationType }, 'Telegram notification failed');
  });
}

export const productRoutes: FastifyPluginAsync<ProductRouteOptions> = async (
  app,
  options
) => {
  app.post(
    '/v1/events/batch',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = eventBatchSchema.safeParse(parseBeaconBody(request.body));
      if (!parsed.success) return validationError(reply, parsed.error.issues);

      const records: AnalyticsEventRecord[] = [];
      for (const event of parsed.data.events) {
        const propertySchema = eventProperties[event.eventName];
        const properties = propertySchema.safeParse(event.properties);
        if (!properties.success) {
          return validationError(reply, properties.error.issues);
        }

        const occurredAt = new Date(event.occurredAt);
        const now = Date.now();
        if (occurredAt.getTime() > now + 5 * 60_000 || occurredAt.getTime() < now - 7 * 86_400_000) {
          return reply.code(400).send({ error: 'invalid_occurred_at' });
        }

        const record: AnalyticsEventRecord = {
          eventId: event.eventId,
          anonymousId: parsed.data.anonymousId,
          sessionId: parsed.data.sessionId,
          eventName: event.eventName,
          path: event.path,
          properties: properties.data,
          occurredAt
        };
        if (event.projectId) record.projectId = event.projectId;
        records.push(record);
      }

      await options.database.insertAnalyticsEvents(records);
      return reply.code(202).send({ status: 'accepted' });
    }
  );

  app.post(
    '/v1/intent',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = intentSchema.safeParse(request.body);
      if (!parsed.success) return validationError(reply, parsed.error.issues);
      if (parsed.data.website) return reply.code(202).send({ status: 'accepted' });

      const { website: _website, ...intent } = parsed.data;
      await options.database.insertIntent(intent);
      if (
        options.notifier &&
        (intent.selectedOption === 'other' || Boolean(intent.optionalComment))
      ) {
        notifyInBackground(
          options.notifier.notifyIntent(intent),
          app.log,
          'intent'
        );
      }
      return reply.code(202).send({ status: 'accepted' });
    }
  );

  app.post(
    '/v1/feedback',
    { config: { rateLimit: { max: 6, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = feedbackSchema.safeParse(request.body);
      if (!parsed.success) return validationError(reply, parsed.error.issues);
      if (parsed.data.website) return reply.code(202).send({ status: 'accepted' });

      const { website: _website, ...feedback } = parsed.data;
      await options.database.insertFeedback(feedback);
      if (options.notifier) {
        notifyInBackground(
          options.notifier.notifyFeedback(feedback),
          app.log,
          'feedback'
        );
      }
      return reply.code(202).send({ status: 'accepted' });
    }
  );

  if (options.reportToken) {
    app.get('/v1/reports/summary', async (request, reply) => {
      if (!hasValidReportToken(request.headers.authorization, options.reportToken!)) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const query = z
        .object({ days: z.coerce.number().int().min(1).max(365).default(30) })
        .strict()
        .safeParse(request.query);
      if (!query.success) return validationError(reply, query.error.issues);

      const since = new Date(Date.now() - query.data.days * 86_400_000);
      return options.database.getProductSummary(since);
    });
  }
};
