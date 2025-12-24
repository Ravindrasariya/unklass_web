CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_number" varchar(15) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cpct_quiz_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"pdf_id" integer,
	"year" varchar(10) NOT NULL,
	"medium" varchar(10) NOT NULL,
	"score" integer,
	"total_questions" integer DEFAULT 10,
	"questions" jsonb,
	"answers" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cpct_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"medium" varchar(10) NOT NULL,
	"location" text NOT NULL,
	"mobile_number" varchar(15) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navodaya_quiz_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"pdf_id" integer,
	"exam_grade" varchar(10) NOT NULL,
	"medium" varchar(10) NOT NULL,
	"score" integer,
	"total_questions" integer DEFAULT 10,
	"questions" jsonb,
	"answers" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "navodaya_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"exam_grade" varchar(10) NOT NULL,
	"medium" varchar(10) NOT NULL,
	"location" text NOT NULL,
	"mobile_number" varchar(15) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"grade" varchar(10) NOT NULL,
	"board" varchar(10) NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"parsed_questions" jsonb,
	"total_questions" integer DEFAULT 0,
	"uploaded_at" timestamp DEFAULT now(),
	CONSTRAINT "pdfs_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "question_pointers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"student_type" varchar(20) NOT NULL,
	"pdf_id" integer NOT NULL,
	"last_question_index" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"pdf_id" integer,
	"subject" text NOT NULL,
	"grade" varchar(10) NOT NULL,
	"board" varchar(10) NOT NULL,
	"score" integer,
	"total_questions" integer DEFAULT 10,
	"questions" jsonb,
	"answers" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"grade" varchar(10) NOT NULL,
	"board" varchar(10) NOT NULL,
	"medium" varchar(10) DEFAULT 'English' NOT NULL,
	"location" text NOT NULL,
	"mobile_number" varchar(15) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unique_visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visitor_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_visitors" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	CONSTRAINT "visitor_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" ADD CONSTRAINT "cpct_quiz_sessions_student_id_cpct_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."cpct_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" ADD CONSTRAINT "cpct_quiz_sessions_pdf_id_pdfs_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" ADD CONSTRAINT "navodaya_quiz_sessions_student_id_navodaya_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."navodaya_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" ADD CONSTRAINT "navodaya_quiz_sessions_pdf_id_pdfs_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_pointers" ADD CONSTRAINT "question_pointers_pdf_id_pdfs_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_pdf_id_pdfs_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id") ON DELETE no action ON UPDATE no action;