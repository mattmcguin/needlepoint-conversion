ALTER TABLE "analytics_events" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "occurred_at" timestamp with time zone NOT NULL;--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_event_id_unique" UNIQUE("event_id");