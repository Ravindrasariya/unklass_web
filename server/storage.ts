import { 
  students, pdfs, quizSessions,
  type Student, type InsertStudent,
  type Pdf, type InsertPdf,
  type QuizSession, type InsertQuizSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByMobile(mobileNumber: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;

  // PDFs
  getPdf(id: number): Promise<Pdf | undefined>;
  getPdfByFilename(filename: string): Promise<Pdf | undefined>;
  getPdfByGradeBoardSubject(grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  createPdf(pdf: InsertPdf): Promise<Pdf>;
  getAllPdfs(): Promise<Pdf[]>;
  deletePdf(id: number): Promise<boolean>;

  // Quiz Sessions
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  getStudentQuizSessions(studentId: number): Promise<QuizSession[]>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByMobile(mobileNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.mobileNumber, mobileNumber));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  // PDFs
  async getPdf(id: number): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.id, id));
    return pdf || undefined;
  }

  async getPdfByFilename(filename: string): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
  }

  async getPdfByGradeBoardSubject(grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(
      and(
        eq(pdfs.grade, grade),
        eq(pdfs.board, board),
        eq(pdfs.subject, subject)
      )
    );
    return pdf || undefined;
  }

  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    const [pdf] = await db.insert(pdfs).values(insertPdf).returning();
    return pdf;
  }

  async getAllPdfs(): Promise<Pdf[]> {
    return await db.select().from(pdfs);
  }

  async deletePdf(id: number): Promise<boolean> {
    const result = await db.delete(pdfs).where(eq(pdfs.id, id)).returning();
    return result.length > 0;
  }

  // Quiz Sessions
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const [session] = await db.insert(quizSessions).values(insertSession).returning();
    return session;
  }

  async updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const [session] = await db
      .update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getQuizSession(id: number): Promise<QuizSession | undefined> {
    const [session] = await db.select().from(quizSessions).where(eq(quizSessions.id, id));
    return session || undefined;
  }

  async getStudentQuizSessions(studentId: number): Promise<QuizSession[]> {
    return await db.select().from(quizSessions).where(eq(quizSessions.studentId, studentId));
  }
}

export const storage = new DatabaseStorage();
