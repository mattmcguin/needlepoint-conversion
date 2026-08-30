CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymous_id" varchar(64) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"project_id" varchar(64),
	"event_name" varchar(80) NOT NULL,
	"path" varchar(300) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymous_id" varchar(64) NOT NULL,
	"project_id" varchar(64),
	"feedback_type" varchar(40) NOT NULL,
	"sentiment" varchar(20),
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text,
	"email" varchar(320),
	"follow_up_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intent_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymous_id" varchar(64) NOT NULL,
	"project_id" varchar(64),
	"prompt_key" varchar(80) NOT NULL,
	"selected_option" varchar(80) NOT NULL,
	"optional_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"payment_link_id" varchar(255),
	"anonymous_id" varchar(200),
	"amount" integer,
	"currency" varchar(3),
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_event_name_created_at_idx" ON "analytics_events" USING btree ("event_name","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_anonymous_id_created_at_idx" ON "analytics_events" USING btree ("anonymous_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feedback_type_created_at_idx" ON "feedback" USING btree ("feedback_type","created_at");--> statement-breakpoint
CREATE INDEX "intent_responses_created_at_idx" ON "intent_responses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "intent_responses_prompt_option_idx" ON "intent_responses" USING btree ("prompt_key","selected_option");--> statement-breakpoint
CREATE INDEX "stripe_events_processed_at_idx" ON "stripe_events" USING btree ("processed_at");