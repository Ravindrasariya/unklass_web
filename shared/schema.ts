import { pgTable, text, varchar, integer, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Unified Students table - stores all registered students
export const unifiedStudents = pgTable("unified_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fatherName: text("father_name").notNull(),
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull().unique(),
  schoolName: text("school_name"), // optional
  dateOfBirth: text("date_of_birth"), // optional, stored as YYYY-MM-DD string
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam types enum
export const EXAM_TYPES = ["board", "cpct", "navodaya", "chapter_practice"] as const;
export type ExamType = typeof EXAM_TYPES[number];

// Student exam profiles - stores preferences per exam type
export const studentExamProfiles = pgTable("student_exam_profiles", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => unifiedStudents.id),
  examType: varchar("exam_type", { length: 20 }).notNull(), // 'board', 'cpct', 'navodaya', 'chapter_practice'
  lastSelections: jsonb("last_selections"), // Store last selected dropdown values
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legacy: Students table - stores registered students (Board Exam) - kept for backward compatibility
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(), // 8th, 10th, 12th
  board: varchar("board", { length: 10 }).notNull(), // MP, CBSE
  medium: varchar("medium", { length: 10 }).notNull().default("English"), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// Legacy: CPCT Students table - stores CPCT exam candidates
export const cpctStudents = pgTable("cpct_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// Legacy: Navodaya Students table - stores JNV entrance exam candidates
export const navodayaStudents = pgTable("navodaya_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  examGrade: varchar("exam_grade", { length: 10 }).notNull(), // 6th, 9th
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// Legacy: Chapter Practice Students table - for NCERT chapter-wise practice
export const chapterPracticeStudents = pgTable("chapter_practice_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  schoolName: text("school_name"),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  medium: varchar("medium", { length: 10 }).notNull().default("English"),
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
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
  studentId: integer("student_id").notNull(), // Can reference unified_students or legacy students
  unifiedStudentId: integer("unified_student_id").references(() => unifiedStudents.id), // New unified reference
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
  studentId: integer("student_id").notNull(),
  unifiedStudentId: integer("unified_student_id").references(() => unifiedStudents.id),
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
  studentId: integer("student_id").notNull(),
  unifiedStudentId: integer("unified_student_id").references(() => unifiedStudents.id),
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
  studentId: integer("student_id").notNull(),
  unifiedStudentId: integer("unified_student_id").references(() => unifiedStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  subject: text("subject").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  chapterName: text("chapter_name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  medium: varchar("medium", { length: 10 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for unified students
export const unifiedStudentsRelations = relations(unifiedStudents, ({ many }) => ({
  examProfiles: many(studentExamProfiles),
}));

export const studentExamProfilesRelations = relations(studentExamProfiles, ({ one }) => ({
  student: one(unifiedStudents, {
    fields: [studentExamProfiles.studentId],
    references: [unifiedStudents.id],
  }),
}));

// Legacy Relations
export const studentsRelations = relations(students, ({ many }) => ({
  quizSessions: many(quizSessions),
}));

export const cpctStudentsRelations = relations(cpctStudents, ({ many }) => ({
  quizSessions: many(cpctQuizSessions),
}));

export const navodayaStudentsRelations = relations(navodayaStudents, ({ many }) => ({
  quizSessions: many(navodayaQuizSessions),
}));

export const pdfsRelations = relations(pdfs, ({ many }) => ({
  quizSessions: many(quizSessions),
  cpctQuizSessions: many(cpctQuizSessions),
  navodayaQuizSessions: many(navodayaQuizSessions),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one }) => ({
  student: one(students, {
    fields: [quizSessions.studentId],
    references: [students.id],
  }),
  unifiedStudent: one(unifiedStudents, {
    fields: [quizSessions.unifiedStudentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [quizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const cpctQuizSessionsRelations = relations(cpctQuizSessions, ({ one }) => ({
  student: one(cpctStudents, {
    fields: [cpctQuizSessions.studentId],
    references: [cpctStudents.id],
  }),
  unifiedStudent: one(unifiedStudents, {
    fields: [cpctQuizSessions.unifiedStudentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [cpctQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const navodayaQuizSessionsRelations = relations(navodayaQuizSessions, ({ one }) => ({
  student: one(navodayaStudents, {
    fields: [navodayaQuizSessions.studentId],
    references: [navodayaStudents.id],
  }),
  unifiedStudent: one(unifiedStudents, {
    fields: [navodayaQuizSessions.unifiedStudentId],
    references: [unifiedStudents.id],
  }),
  pdf: one(pdfs, {
    fields: [navodayaQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

export const chapterPracticeStudentsRelations = relations(chapterPracticeStudents, ({ many }) => ({
  quizSessions: many(chapterPracticeQuizSessions),
}));

export const chapterPracticeQuizSessionsRelations = relations(chapterPracticeQuizSessions, ({ one }) => ({
  student: one(chapterPracticeStudents, {
    fields: [chapterPracticeQuizSessions.studentId],
    references: [chapterPracticeStudents.id],
  }),
  unifiedStudent: one(unifiedStudents, {
    fields: [chapterPracticeQuizSessions.unifiedStudentId],
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

// Legacy insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertCpctStudentSchema = createInsertSchema(cpctStudents).omit({
  id: true,
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

export const insertNavodayaStudentSchema = createInsertSchema(navodayaStudents).omit({
  id: true,
});

export const insertNavodayaQuizSessionSchema = createInsertSchema(navodayaQuizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertChapterPracticeStudentSchema = createInsertSchema(chapterPracticeStudents).omit({
  id: true,
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

// Legacy types
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertCpctStudent = z.infer<typeof insertCpctStudentSchema>;
export type CpctStudent = typeof cpctStudents.$inferSelect;

export type InsertNavodayaStudent = z.infer<typeof insertNavodayaStudentSchema>;
export type NavodayaStudent = typeof navodayaStudents.$inferSelect;

export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfs.$inferSelect;

export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;

export type InsertCpctQuizSession = z.infer<typeof insertCpctQuizSessionSchema>;
export type CpctQuizSession = typeof cpctQuizSessions.$inferSelect;

export type InsertNavodayaQuizSession = z.infer<typeof insertNavodayaQuizSessionSchema>;
export type NavodayaQuizSession = typeof navodayaQuizSessions.$inferSelect;

export type InsertChapterPracticeStudent = z.infer<typeof insertChapterPracticeStudentSchema>;
export type ChapterPracticeStudent = typeof chapterPracticeStudents.$inferSelect;

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
  studentId: integer("student_id").notNull(),
  studentType: varchar("student_type", { length: 20 }).notNull(),
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
