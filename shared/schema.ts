import { pgTable, text, varchar, integer, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table - stores registered students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(), // 8th, 10th, 12th
  board: varchar("board", { length: 10 }).notNull(), // MP, CBSE
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
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Quiz sessions table - stores quiz attempts and results
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

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  quizSessions: many(quizSessions),
}));

export const pdfsRelations = relations(pdfs, ({ many }) => ({
  quizSessions: many(quizSessions),
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

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
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

// Types
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfs.$inferSelect;

export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;

// Question type for the quiz
export const questionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
});

export type Question = z.infer<typeof questionSchema>;
