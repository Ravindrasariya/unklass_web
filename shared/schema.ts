import { pgTable, text, varchar, integer, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Unified Students table - stores all registered students
export const unifiedStudents = pgTable("unified_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fatherName: text("father_name"),
  location: text("location"),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull().unique(),
  schoolName: text("school_name"),
  dateOfBirth: text("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam types enum
export const EXAM_TYPES = ["board", "cpct", "navodaya", "chapter_practice"] as const;
export type ExamType = typeof EXAM_TYPES[number];

// Student exam profiles - stores preferences per exam type
export const studentExamProfiles = pgTable("student_exam_profiles", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  examType: varchar("exam_type", { length: 20 }).notNull(),
  lastSelections: jsonb("last_selections"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PDFs table - stores uploaded PDF metadata (admin functionality)
export const pdfs = pgTable("pdfs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 20 }).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  parsedQuestions: jsonb("parsed_questions"),
  totalQuestions: integer("total_questions").default(0),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Quiz sessions table - stores quiz attempts and results (Board Exam)
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  subject: text("subject").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  medium: varchar("medium", { length: 10 }).default("English"),
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CPCT exam sections
export const CPCT_SECTIONS = [
  "MS Office",
  "Software Operating System & IT Fundamentals",
  "Internet, Networking & Security",
  "Hardware Peripheral & Devices",
  "Aptitude & Logical Reasoning",
] as const;

export type CpctSection = typeof CPCT_SECTIONS[number];

// CPCT Quiz sessions table
export const cpctQuizSessions = pgTable("cpct_quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  year: varchar("year", { length: 10 }).notNull(),
  section: varchar("section", { length: 100 }),
  medium: varchar("medium", { length: 10 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Navodaya exam sections
export const NAVODAYA_SECTIONS_6TH = [
  "Mental Ability Test",
  "Arithmetic Test",
  "Language Test",
] as const;

export const NAVODAYA_SECTIONS_9TH = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
] as const;

export type NavodayaSection6th = typeof NAVODAYA_SECTIONS_6TH[number];
export type NavodayaSection9th = typeof NAVODAYA_SECTIONS_9TH[number];

// Navodaya Quiz sessions table
export const navodayaQuizSessions = pgTable("navodaya_quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  examGrade: varchar("exam_grade", { length: 10 }).notNull(),
  section: varchar("section", { length: 100 }),
  medium: varchar("medium", { length: 10 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chapter Practice subjects
export const CHAPTER_PRACTICE_SUBJECTS = [
  "Mathematics",
  "Science", 
  "SST",
  "Hindi",
  "English",
] as const;

export type ChapterPracticeSubject = typeof CHAPTER_PRACTICE_SUBJECTS[number];

// Supported grades for Chapter Practice
export const CHAPTER_PRACTICE_GRADES = ["6th", "7th", "8th", "9th", "10th"] as const;

// Chapter Practice Quiz sessions table
export const chapterPracticeQuizSessions = pgTable("chapter_practice_quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  subject: text("subject").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  chapterName: text("chapter_name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  medium: varchar("medium", { length: 10 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  currentQuestionIndex: integer("current_question_index").default(0),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for unified students
export const unifiedStudentsRelations = relations(unifiedStudents, ({ many }) => ({
  examProfiles: many(studentExamProfiles),
  quizSessions: many(quizSessions),
  cpctQuizSessions: many(cpctQuizSessions),
  navodayaQuizSessions: many(navodayaQuizSessions),
  chapterPracticeQuizSessions: many(chapterPracticeQuizSessions),
}));

export const studentExamProfilesRelations = relations(studentExamProfiles, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [studentExamProfiles.studentId],
    references: [unifiedStudents.id],
  }),
}));

export const pdfsRelations = relations(pdfs, ({ many }) => ({
  quizSessions: many(quizSessions),
  cpctQuizSessions: many(cpctQuizSessions),
  navodayaQuizSessions: many(navodayaQuizSessions),
  chapterPracticeQuizSessions: many(chapterPracticeQuizSessions),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [quizSessions.studentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [quizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const cpctQuizSessionsRelations = relations(cpctQuizSessions, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [cpctQuizSessions.studentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [cpctQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const navodayaQuizSessionsRelations = relations(navodayaQuizSessions, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [navodayaQuizSessions.studentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [navodayaQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const chapterPracticeQuizSessionsRelations = relations(chapterPracticeQuizSessions, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [chapterPracticeQuizSessions.studentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [chapterPracticeQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

// Insert schemas
export const insertUnifiedStudentSchema = createInsertSchema(unifiedStudents).omit({
  id: true,
  createdAt: true,
});

export const insertStudentExamProfileSchema = createInsertSchema(studentExamProfiles).omit({
  id: true,
  updatedAt: true,
});

export const insertPdfSchema = createInsertSchema(pdfs).omit({
  id: true,
  uploadedAt: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertCpctQuizSessionSchema = createInsertSchema(cpctQuizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertNavodayaQuizSessionSchema = createInsertSchema(navodayaQuizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertChapterPracticeQuizSessionSchema = createInsertSchema(chapterPracticeQuizSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUnifiedStudent = z.infer<typeof insertUnifiedStudentSchema>;
export type UnifiedStudent = typeof unifiedStudents.$inferSelect;

export type InsertStudentExamProfile = z.infer<typeof insertStudentExamProfileSchema>;
export type StudentExamProfile = typeof studentExamProfiles.$inferSelect;

export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfs.$inferSelect;

export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;

export type InsertCpctQuizSession = z.infer<typeof insertCpctQuizSessionSchema>;
export type CpctQuizSession = typeof cpctQuizSessions.$inferSelect;

export type InsertNavodayaQuizSession = z.infer<typeof insertNavodayaQuizSessionSchema>;
export type NavodayaQuizSession = typeof navodayaQuizSessions.$inferSelect;

export type InsertChapterPracticeQuizSession = z.infer<typeof insertChapterPracticeQuizSessionSchema>;
export type ChapterPracticeQuizSession = typeof chapterPracticeQuizSessions.$inferSelect;

// Chapter metadata type for PDF
export const chapterMetadataSchema = z.object({
  chapterNumber: z.number(),
  chapterName: z.string(),
  questionCount: z.number(),
  startIndex: z.number(),
  endIndex: z.number(),
});

export type ChapterMetadata = z.infer<typeof chapterMetadataSchema>;

// Contact submissions table
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactNumber: varchar("contact_number", { length: 15 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question pointers table - tracks last question index per student + PDF for sequential picking
export const questionPointers = pgTable("question_pointers", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").notNull().references(() => pdfs.id),
  lastQuestionIndex: integer("last_question_index").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visitor stats table
export const visitorStats = pgTable("visitor_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),
  totalVisitors: integer("total_visitors").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
});

// Unique visitors table
export const uniqueVisitors = pgTable("unique_visitors", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notices table
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Insert schemas for utility tables
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertVisitorStatsSchema = createInsertSchema(visitorStats).omit({
  id: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
});

// Types for utility tables
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

export type InsertVisitorStats = z.infer<typeof insertVisitorStatsSchema>;
export type VisitorStats = typeof visitorStats.$inferSelect;

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof notices.$inferSelect;

export type QuestionPointer = typeof questionPointers.$inferSelect;

// Parsed question structure
export const parsedQuestionSchema = z.object({
  index: z.number(),
  rawText: z.string(),
  questionText: z.string().optional(),
  answer: z.string().optional(),
});

export type ParsedQuestion = z.infer<typeof parsedQuestionSchema>;

// Question type for the quiz
export const questionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
});

export type Question = z.infer<typeof questionSchema>;

// Exam profile selections types
export interface BoardExamSelections {
  grade: string;
  board: string;
  medium: string;
  subject?: string;
}

export interface CpctExamSelections {
  medium: string;
  section?: string;
}

export interface NavodayaExamSelections {
  medium: string;
  examGrade: string;
  section?: string;
}

export interface ChapterPracticeSelections {
  grade: string;
  board: string;
  medium: string;
  subject?: string;
  chapter?: string;
}
