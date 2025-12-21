import { 
  students, pdfs, quizSessions, cpctStudents, cpctQuizSessions,
  navodayaStudents, navodayaQuizSessions,
  contactSubmissions, visitorStats, uniqueVisitors,
  type Student, type InsertStudent,
  type Pdf, type InsertPdf,
  type QuizSession, type InsertQuizSession,
  type CpctStudent, type InsertCpctStudent,
  type CpctQuizSession, type InsertCpctQuizSession,
  type NavodayaStudent, type InsertNavodayaStudent,
  type NavodayaQuizSession, type InsertNavodayaQuizSession,
  type ContactSubmission, type InsertContactSubmission,
  type VisitorStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, sql, desc, gte, lte, isNotNull, or } from "drizzle-orm";

// Normalize grade to handle "8th" vs "8", "10th" vs "10", etc.
function normalizeGrade(grade: string): string[] {
  // Remove ordinal suffixes and get base number
  const base = grade.replace(/(st|nd|rd|th)$/i, '').trim();
  // Return both formats for matching
  return [base, `${base}th`];
}

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

  // Navodaya Students
  getNavodayaStudent(id: number): Promise<NavodayaStudent | undefined>;
  getNavodayaStudentByMobile(mobileNumber: string): Promise<NavodayaStudent | undefined>;
  createNavodayaStudent(student: InsertNavodayaStudent): Promise<NavodayaStudent>;
  getAllNavodayaStudents(): Promise<NavodayaStudent[]>;

  // Navodaya Quiz Sessions
  createNavodayaQuizSession(session: InsertNavodayaQuizSession): Promise<NavodayaQuizSession>;
  updateNavodayaQuizSession(id: number, updates: Partial<NavodayaQuizSession>): Promise<NavodayaQuizSession | undefined>;
  getNavodayaQuizSession(id: number): Promise<NavodayaQuizSession | undefined>;
  getNavodayaStudentQuizSessions(studentId: number): Promise<NavodayaQuizSession[]>;
  getNavodayaStudentPreviousQuestions(studentId: number): Promise<string[]>;
  getNavodayaPdf(examGrade: string): Promise<Pdf | undefined>;

  // Contact Submissions
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;

  // Visitor Stats
  incrementVisitorCount(date: string, ipAddress?: string): Promise<VisitorStats>;
  getVisitorStats(): Promise<VisitorStats[]>;
  getTotalVisitors(): Promise<number>;
  getTotalUniqueVisitors(): Promise<number>;

  // Leaderboard
  getWeeklyLeaderboard(weekStartUtc: Date, weekEndUtc: Date): Promise<{
    boardExam: LeaderboardEntry[];
    cpct: LeaderboardEntry[];
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  accuracy: number;
  totalScore: number;
  totalQuestions: number;
  testsCompleted: number;
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
    // Get normalized grade variants (e.g., "12th" -> ["12", "12th"])
    const gradeVariants = normalizeGrade(grade);
    
    const [pdf] = await db.select().from(pdfs).where(
      and(
        or(
          eq(pdfs.grade, gradeVariants[0]),
          eq(pdfs.grade, gradeVariants[1])
        ),
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
    // First delete related quiz sessions that reference this PDF
    await db.delete(quizSessions).where(eq(quizSessions.pdfId, id));
    // Then delete the PDF
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

  // Navodaya Students
  async getNavodayaStudent(id: number): Promise<NavodayaStudent | undefined> {
    const [student] = await db.select().from(navodayaStudents).where(eq(navodayaStudents.id, id));
    return student || undefined;
  }

  async getNavodayaStudentByMobile(mobileNumber: string): Promise<NavodayaStudent | undefined> {
    const [student] = await db.select().from(navodayaStudents).where(eq(navodayaStudents.mobileNumber, mobileNumber));
    return student || undefined;
  }

  async createNavodayaStudent(insertStudent: InsertNavodayaStudent): Promise<NavodayaStudent> {
    const [student] = await db.insert(navodayaStudents).values(insertStudent).returning();
    return student;
  }

  async getAllNavodayaStudents(): Promise<NavodayaStudent[]> {
    return await db.select().from(navodayaStudents);
  }

  // Navodaya Quiz Sessions
  async createNavodayaQuizSession(insertSession: InsertNavodayaQuizSession): Promise<NavodayaQuizSession> {
    const [session] = await db.insert(navodayaQuizSessions).values(insertSession).returning();
    return session;
  }

  async updateNavodayaQuizSession(id: number, updates: Partial<NavodayaQuizSession>): Promise<NavodayaQuizSession | undefined> {
    const [session] = await db
      .update(navodayaQuizSessions)
      .set(updates)
      .where(eq(navodayaQuizSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getNavodayaQuizSession(id: number): Promise<NavodayaQuizSession | undefined> {
    const [session] = await db.select().from(navodayaQuizSessions).where(eq(navodayaQuizSessions.id, id));
    return session || undefined;
  }

  async getNavodayaStudentQuizSessions(studentId: number): Promise<NavodayaQuizSession[]> {
    return await db.select().from(navodayaQuizSessions).where(eq(navodayaQuizSessions.studentId, studentId));
  }

  async getNavodayaStudentPreviousQuestions(studentId: number): Promise<string[]> {
    const sessions = await db.select().from(navodayaQuizSessions).where(eq(navodayaQuizSessions.studentId, studentId));
    
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

  async getNavodayaPdf(examGrade: string): Promise<Pdf | undefined> {
    // Look for {grade}_navodaya.pdf format (e.g., 6th_navodaya.pdf, 9th_navodaya.pdf)
    const filename = `${examGrade}_navodaya.pdf`;
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
  }

  // Contact Submissions
  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(insertSubmission).returning();
    return submission;
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  // Visitor Stats
  async incrementVisitorCount(date: string, ipAddress?: string): Promise<VisitorStats> {
    let isUniqueVisit = false;
    
    // Check if this IP has visited today (if IP provided)
    if (ipAddress) {
      const existingVisit = await db.select().from(uniqueVisitors)
        .where(and(eq(uniqueVisitors.ipAddress, ipAddress), eq(uniqueVisitors.date, date)));
      
      if (existingVisit.length === 0) {
        // New unique visitor for today
        await db.insert(uniqueVisitors).values({ ipAddress, date });
        isUniqueVisit = true;
      }
    }
    
    // Try to update existing record first
    const existing = await db.select().from(visitorStats).where(eq(visitorStats.date, date));
    
    if (existing.length > 0) {
      const updateData: any = { totalVisitors: sql`${visitorStats.totalVisitors} + 1` };
      if (isUniqueVisit) {
        updateData.uniqueVisitors = sql`${visitorStats.uniqueVisitors} + 1`;
      }
      const [updated] = await db
        .update(visitorStats)
        .set(updateData)
        .where(eq(visitorStats.date, date))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(visitorStats).values({ 
        date, 
        totalVisitors: 1,
        uniqueVisitors: isUniqueVisit ? 1 : 0
      }).returning();
      return created;
    }
  }

  async getVisitorStats(): Promise<VisitorStats[]> {
    return await db.select().from(visitorStats).orderBy(desc(visitorStats.date));
  }

  async getTotalVisitors(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${visitorStats.totalVisitors}), 0)` }).from(visitorStats);
    return result[0]?.total || 0;
  }

  async getTotalUniqueVisitors(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${visitorStats.uniqueVisitors}), 0)` }).from(visitorStats);
    return result[0]?.total || 0;
  }

  // Leaderboard
  async getWeeklyLeaderboard(weekStartUtc: Date, weekEndUtc: Date): Promise<{
    boardExam: LeaderboardEntry[];
    cpct: LeaderboardEntry[];
  }> {
    // Board Exam Leaderboard
    const boardExamResults = await db
      .select({
        studentId: quizSessions.studentId,
        studentName: students.name,
        totalScore: sql<number>`COALESCE(SUM(${quizSessions.score}), 0)`,
        totalQuestions: sql<number>`COALESCE(SUM(${quizSessions.totalQuestions}), 0)`,
        testsCompleted: sql<number>`COUNT(*)`,
      })
      .from(quizSessions)
      .innerJoin(students, eq(quizSessions.studentId, students.id))
      .where(
        and(
          isNotNull(quizSessions.score),
          isNotNull(quizSessions.completedAt),
          sql`${quizSessions.totalQuestions} > 0`,
          gte(quizSessions.completedAt, weekStartUtc),
          lte(quizSessions.completedAt, weekEndUtc)
        )
      )
      .groupBy(quizSessions.studentId, students.name)
      .orderBy(sql`(COALESCE(SUM(${quizSessions.score}), 0)::float / NULLIF(SUM(${quizSessions.totalQuestions}), 0)) DESC NULLS LAST`)
      .limit(5);

    const boardExam: LeaderboardEntry[] = boardExamResults.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      totalScore: Number(row.totalScore),
      totalQuestions: Number(row.totalQuestions),
      accuracy: row.totalQuestions > 0 ? Math.round((Number(row.totalScore) / Number(row.totalQuestions)) * 100) : 0,
      testsCompleted: Number(row.testsCompleted),
    }));

    // CPCT Leaderboard
    const cpctResults = await db
      .select({
        studentId: cpctQuizSessions.studentId,
        studentName: cpctStudents.name,
        totalScore: sql<number>`COALESCE(SUM(${cpctQuizSessions.score}), 0)`,
        totalQuestions: sql<number>`COALESCE(SUM(${cpctQuizSessions.totalQuestions}), 0)`,
        testsCompleted: sql<number>`COUNT(*)`,
      })
      .from(cpctQuizSessions)
      .innerJoin(cpctStudents, eq(cpctQuizSessions.studentId, cpctStudents.id))
      .where(
        and(
          isNotNull(cpctQuizSessions.score),
          isNotNull(cpctQuizSessions.completedAt),
          sql`${cpctQuizSessions.totalQuestions} > 0`,
          gte(cpctQuizSessions.completedAt, weekStartUtc),
          lte(cpctQuizSessions.completedAt, weekEndUtc)
        )
      )
      .groupBy(cpctQuizSessions.studentId, cpctStudents.name)
      .orderBy(sql`(COALESCE(SUM(${cpctQuizSessions.score}), 0)::float / NULLIF(SUM(${cpctQuizSessions.totalQuestions}), 0)) DESC NULLS LAST`)
      .limit(5);

    const cpct: LeaderboardEntry[] = cpctResults.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      totalScore: Number(row.totalScore),
      totalQuestions: Number(row.totalQuestions),
      accuracy: row.totalQuestions > 0 ? Math.round((Number(row.totalScore) / Number(row.totalQuestions)) * 100) : 0,
      testsCompleted: Number(row.testsCompleted),
    }));

    return { boardExam, cpct };
  }
}

export const storage = new DatabaseStorage();
