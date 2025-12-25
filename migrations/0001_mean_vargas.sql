CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" ADD COLUMN "section" varchar(100);--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" ADD COLUMN "section" varchar(100);--> statement-breakpoint
ALTER TABLE "pdfs" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pdfs" ADD COLUMN "archived_at" timestamp;