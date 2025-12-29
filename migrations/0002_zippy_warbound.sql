CREATE TABLE "chapter_practice_quiz_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"unified_student_id" integer,
	"pdf_id" integer,
	"subject" text NOT NULL,
	"chapter_number" integer NOT NULL,
	"chapter_name" text NOT NULL,
	"grade" varchar(10) NOT NULL,
	"board" varchar(10) NOT NULL,
	"medium" varchar(10) NOT NULL,
	"score" integer,
	"total_questions" integer,
	"current_question_index" integer DEFAULT 0,
	"questions" jsonb,
	"answers" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chapter_practice_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"school_name" text,
	"grade" varchar(10) NOT NULL,
	"board" varchar(10) NOT NULL,
	"medium" varchar(10) DEFAULT 'English' NOT NULL,
	"location" text NOT NULL,
	"mobile_number" varchar(15) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_exam_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"exam_type" varchar(20) NOT NULL,
	"last_selections" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unified_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"father_name" text,
	"location" text,
	"mobile_number" varchar(15) NOT NULL,
	"school_name" text,
	"date_of_birth" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unified_students_mobile_number_unique" UNIQUE("mobile_number")
);
--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" DROP CONSTRAINT "cpct_quiz_sessions_student_id_cpct_students_id_fk";
--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" DROP CONSTRAINT "navodaya_quiz_sessions_student_id_navodaya_students_id_fk";
--> statement-breakpoint
ALTER TABLE "quiz_sessions" DROP CONSTRAINT "quiz_sessions_student_id_students_id_fk";
--> statement-breakpoint
ALTER TABLE "pdfs" ALTER COLUMN "board" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" ADD COLUMN "unified_student_id" integer;--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" ADD COLUMN "unified_student_id" integer;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD COLUMN "unified_student_id" integer;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD COLUMN "medium" varchar(10) DEFAULT 'English';--> statement-breakpoint
ALTER TABLE "chapter_practice_quiz_sessions" ADD CONSTRAINT "chapter_practice_quiz_sessions_unified_student_id_unified_students_id_fk" FOREIGN KEY ("unified_student_id") REFERENCES "public"."unified_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_practice_quiz_sessions" ADD CONSTRAINT "chapter_practice_quiz_sessions_pdf_id_pdfs_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_exam_profiles" ADD CONSTRAINT "student_exam_profiles_student_id_unified_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."unified_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpct_quiz_sessions" ADD CONSTRAINT "cpct_quiz_sessions_unified_student_id_unified_students_id_fk" FOREIGN KEY ("unified_student_id") REFERENCES "public"."unified_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navodaya_quiz_sessions" ADD CONSTRAINT "navodaya_quiz_sessions_unified_student_id_unified_students_id_fk" FOREIGN KEY ("unified_student_id") REFERENCES "public"."unified_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_unified_student_id_unified_students_id_fk" FOREIGN KEY ("unified_student_id") REFERENCES "public"."unified_students"("id") ON DELETE no action ON UPDATE no action;