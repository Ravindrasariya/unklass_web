import { pgTable, text, varchar, integer, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table - stores registered students (Board Exam)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(), // 8th, 10th, 12th
  board: varchar("board", { length: 10 }).notNull(), // MP, CBSE
  medium: varchar("medium", { length: 10 }).notNull().default("English"), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// CPCT Students table - stores CPCT exam candidates
export const cpctStudents = pgTable("cpct_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// Navodaya Students table - stores JNV entrance exam candidates
export const navodayaStudents = pgTable("navodaya_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  examGrade: varchar("exam_grade", { length: 10 }).notNull(), // 6th, 9th
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi, English
  location: text("location").notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
});

// PDFs table - stores uploaded PDF metadata (admin functionality)
export const pdfs = pgTable("pdfs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(), // {grade}_{board}_{subject}.pdf
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // Extracted text from PDF
  parsedQuestions: jsonb("parsed_questions"), // Array of pre-parsed question objects from PDF
  totalQuestions: integer("total_questions").default(0), // Count of parsed questions
  isArchived: boolean("is_archived").default(false), // Soft delete - archived PDFs are hidden but quiz history preserved
  archivedAt: timestamp("archived_at"), // When the PDF was archived (for auto-cleanup after 3 months)
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Quiz sessions table - stores quiz attempts and results (Board Exam)
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  subject: text("subject").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  board: varchar("board", { length: 10 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"), // Store generated questions
  answers: jsonb("answers"), // Store student answers
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CPCT Quiz sessions table - stores CPCT quiz attempts and results
export const cpctQuizSessions = pgTable("cpct_quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => cpctStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  year: varchar("year", { length: 10 }).notNull(), // CPCT year
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi or English
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Navodaya Quiz sessions table - stores JNV quiz attempts and results
export const navodayaQuizSessions = pgTable("navodaya_quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => navodayaStudents.id),
  pdfId: integer("pdf_id").references(() => pdfs.id),
  examGrade: varchar("exam_grade", { length: 10 }).notNull(), // 6th, 9th
  medium: varchar("medium", { length: 10 }).notNull(), // Hindi or English
  score: integer("score"),
  totalQuestions: integer("total_questions").default(10),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
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
  pdf: one(pdfs, {
    fields: [navodayaQuizSessions.pdfId],
    references: [pdfs.id],
  }),
}));

// Insert schemas
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

// Types
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

// Contact submissions table - stores contact form submissions
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
  studentType: varchar("student_type", { length: 20 }).notNull(), // 'board', 'cpct', 'navodaya'
  pdfId: integer("pdf_id").notNull().references(() => pdfs.id),
  lastQuestionIndex: integer("last_question_index").notNull().default(0), // 0-based index of last question asked
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visitor stats table - stores daily visitor counts
export const visitorStats = pgTable("visitor_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD format
  totalVisitors: integer("total_visitors").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
});

// Unique visitors table - tracks individual visitors by IP
export const uniqueVisitors = pgTable("unique_visitors", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertVisitorStatsSchema = createInsertSchema(visitorStats).omit({
  id: true,
});

// Types for new tables
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

export type InsertVisitorStats = z.infer<typeof insertVisitorStatsSchema>;
export type VisitorStats = typeof visitorStats.$inferSelect;

export type QuestionPointer = typeof questionPointers.$inferSelect;

// Parsed question structure (stored in PDF)
export const parsedQuestionSchema = z.object({
  index: z.number(),
  rawText: z.string(), // Original text from PDF
  questionText: z.string().optional(), // Cleaned question text if extracted
  answer: z.string().optional(), // Answer if found in PDF
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
