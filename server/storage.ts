import { 
  students, pdfs, quizSessions, cpctStudents, cpctQuizSessions,
  type Student, type InsertStudent,
  type Pdf, type InsertPdf,
  type QuizSession, type InsertQuizSession,
  type CpctStudent, type InsertCpctStudent,
  type CpctQuizSession, type InsertCpctQuizSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByMobile(mobileNumber: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getAllStudents(): Promise<Student[]>;

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
  getStudentPreviousQuestions(studentId: number, subject: string): Promise<string[]>;

  // CPCT Students
  getCpctStudent(id: number): Promise<CpctStudent | undefined>;
  getCpctStudentByMobile(mobileNumber: string): Promise<CpctStudent | undefined>;
  createCpctStudent(student: InsertCpctStudent): Promise<CpctStudent>;
  getAllCpctStudents(): Promise<CpctStudent[]>;

  // CPCT Quiz Sessions
  createCpctQuizSession(session: InsertCpctQuizSession): Promise<CpctQuizSession>;
  updateCpctQuizSession(id: number, updates: Partial<CpctQuizSession>): Promise<CpctQuizSession | undefined>;
  getCpctQuizSession(id: number): Promise<CpctQuizSession | undefined>;
  getCpctStudentQuizSessions(studentId: number): Promise<CpctQuizSession[]>;
  getCpctStudentPreviousQuestions(studentId: number): Promise<string[]>;
  getCpctPdf(year: string): Promise<Pdf | undefined>;
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

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
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

  async getStudentPreviousQuestions(studentId: number, subject: string): Promise<string[]> {
    const sessions = await db.select().from(quizSessions).where(
      and(
        eq(quizSessions.studentId, studentId),
        eq(quizSessions.subject, subject)
      )
    );
    
    const previousQuestions: string[] = [];
    for (const session of sessions) {
      if (session.questions && Array.isArray(session.questions)) {
        for (const q of session.questions as any[]) {
          if (q.question) {
            previousQuestions.push(q.question);
          }
        }
      }
    }
    return previousQuestions;
  }

  // CPCT Students
  async getCpctStudent(id: number): Promise<CpctStudent | undefined> {
    const [student] = await db.select().from(cpctStudents).where(eq(cpctStudents.id, id));
    return student || undefined;
  }

  async getCpctStudentByMobile(mobileNumber: string): Promise<CpctStudent | undefined> {
    const [student] = await db.select().from(cpctStudents).where(eq(cpctStudents.mobileNumber, mobileNumber));
    return student || undefined;
  }

  async createCpctStudent(insertStudent: InsertCpctStudent): Promise<CpctStudent> {
    const [student] = await db.insert(cpctStudents).values(insertStudent).returning();
    return student;
  }

  async getAllCpctStudents(): Promise<CpctStudent[]> {
    return await db.select().from(cpctStudents);
  }

  // CPCT Quiz Sessions
  async createCpctQuizSession(insertSession: InsertCpctQuizSession): Promise<CpctQuizSession> {
    const [session] = await db.insert(cpctQuizSessions).values(insertSession).returning();
    return session;
  }

  async updateCpctQuizSession(id: number, updates: Partial<CpctQuizSession>): Promise<CpctQuizSession | undefined> {
    const [session] = await db
      .update(cpctQuizSessions)
      .set(updates)
      .where(eq(cpctQuizSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getCpctQuizSession(id: number): Promise<CpctQuizSession | undefined> {
    const [session] = await db.select().from(cpctQuizSessions).where(eq(cpctQuizSessions.id, id));
    return session || undefined;
  }

  async getCpctStudentQuizSessions(studentId: number): Promise<CpctQuizSession[]> {
    return await db.select().from(cpctQuizSessions).where(eq(cpctQuizSessions.studentId, studentId));
  }

  async getCpctStudentPreviousQuestions(studentId: number): Promise<string[]> {
    const sessions = await db.select().from(cpctQuizSessions).where(eq(cpctQuizSessions.studentId, studentId));
    
    const previousQuestions: string[] = [];
    for (const session of sessions) {
      if (session.questions && Array.isArray(session.questions)) {
        for (const q of session.questions as any[]) {
          if (q.question) {
            previousQuestions.push(q.question);
          }
        }
      }
    }
    return previousQuestions;
  }

  async getCpctPdf(year: string): Promise<Pdf | undefined> {
    // Look for CPCT_Year.pdf format
    const filename = `CPCT_${year}.pdf`;
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
  }
}

export const storage = new DatabaseStorage();
