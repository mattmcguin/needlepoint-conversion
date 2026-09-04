import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull().unique(),
    anonymousId: varchar('anonymous_id', { length: 64 }).notNull(),
    sessionId: varchar('session_id', { length: 64 }).notNull(),
    projectId: varchar('project_id', { length: 64 }),
    eventName: varchar('event_name', { length: 80 }).notNull(),
    path: varchar('path', { length: 300 }).notNull(),
    properties: jsonb('properties')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('analytics_events_created_at_idx').on(table.createdAt),
    index('analytics_events_occurred_at_idx').on(table.occurredAt),
    index('analytics_events_event_name_created_at_idx').on(
      table.eventName,
      table.createdAt
    ),
    index('analytics_events_anonymous_id_created_at_idx').on(
      table.anonymousId,
      table.createdAt
    )
  ]
);

export const intentResponses = pgTable(
  'intent_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    anonymousId: varchar('anonymous_id', { length: 64 }).notNull(),
    projectId: varchar('project_id', { length: 64 }),
    promptKey: varchar('prompt_key', { length: 80 }).notNull(),
    selectedOption: varchar('selected_option', { length: 80 }).notNull(),
    optionalComment: text('optional_comment'),
    email: varchar('email', { length: 320 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('intent_responses_created_at_idx').on(table.createdAt),
    index('intent_responses_prompt_option_idx').on(
      table.promptKey,
      table.selectedOption
    )
  ]
);

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    anonymousId: varchar('anonymous_id', { length: 64 }).notNull(),
    projectId: varchar('project_id', { length: 64 }),
    feedbackType: varchar('feedback_type', { length: 40 }).notNull(),
    sentiment: varchar('sentiment', { length: 20 }),
    reasons: jsonb('reasons').$type<string[]>().notNull().default([]),
    message: text('message'),
    email: varchar('email', { length: 320 }),
    followUpConsent: boolean('follow_up_consent').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('feedback_created_at_idx').on(table.createdAt),
    index('feedback_type_created_at_idx').on(table.feedbackType, table.createdAt)
  ]
);

export const stripeEvents = pgTable(
  'stripe_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 120 }).notNull(),
    paymentLinkId: varchar('payment_link_id', { length: 255 }),
    anonymousId: varchar('anonymous_id', { length: 200 }),
    amount: integer('amount'),
    currency: varchar('currency', { length: 3 }),
    processedAt: timestamp('processed_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [index('stripe_events_processed_at_idx').on(table.processedAt)]
);
