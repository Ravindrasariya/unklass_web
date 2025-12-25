import { 
  students, pdfs, quizSessions, cpctStudents, cpctQuizSessions,
  navodayaStudents, navodayaQuizSessions, chapterPracticeStudents, chapterPracticeQuizSessions,
  contactSubmissions, visitorStats, uniqueVisitors, questionPointers, notices,
  type Student, type InsertStudent,
  type Pdf, type InsertPdf,
  type QuizSession, type InsertQuizSession,
  type CpctStudent, type InsertCpctStudent,
  type CpctQuizSession, type InsertCpctQuizSession,
  type NavodayaStudent, type InsertNavodayaStudent,
  type NavodayaQuizSession, type InsertNavodayaQuizSession,
  type ChapterPracticeStudent, type InsertChapterPracticeStudent,
  type ChapterPracticeQuizSession, type InsertChapterPracticeQuizSession,
  type ContactSubmission, type InsertContactSubmission,
  type VisitorStats,
  type QuestionPointer, type ParsedQuestion, type ChapterMetadata,
  type Notice, type InsertNotice
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, sql, desc, gte, lte, lt, isNotNull, or } from "drizzle-orm";

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
  updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getAllStudents(): Promise<Student[]>;

  // PDFs
  getPdf(id: number): Promise<Pdf | undefined>;
  getPdfByFilename(filename: string): Promise<Pdf | undefined>;
  getAnyPdfByFilename(filename: string): Promise<Pdf | undefined>;
  getPdfByGradeBoardSubject(grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  createPdf(pdf: InsertPdf): Promise<Pdf>;
  replacePdf(id: number, content: string, grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  getAllPdfs(): Promise<Pdf[]>;
  getActivePdfs(): Promise<Pdf[]>;
  deletePdf(id: number): Promise<boolean>;
  restorePdf(id: number): Promise<boolean>;
  cleanupOldArchivedPdfs(): Promise<number>;

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
  updateCpctStudent(id: number, updates: Partial<InsertCpctStudent>): Promise<CpctStudent | undefined>;
  deleteCpctStudent(id: number): Promise<boolean>;
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
  updateNavodayaStudent(id: number, updates: Partial<InsertNavodayaStudent>): Promise<NavodayaStudent | undefined>;
  deleteNavodayaStudent(id: number): Promise<boolean>;
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

  // Question Pointers (for sequential question picking)
  getQuestionPointer(studentId: number, studentType: string, pdfId: number): Promise<QuestionPointer | undefined>;
  updateQuestionPointer(studentId: number, studentType: string, pdfId: number, lastQuestionIndex: number): Promise<QuestionPointer>;
  
  // PDF parsed questions
  updatePdfParsedQuestions(pdfId: number, parsedQuestions: ParsedQuestion[], totalQuestions: number): Promise<Pdf | undefined>;

  // Notices
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
  getActiveNotices(): Promise<Notice[]>;
  getAllNotices(): Promise<Notice[]>;

  // Chapter Practice Students
  getChapterPracticeStudent(id: number): Promise<ChapterPracticeStudent | undefined>;
  getChapterPracticeStudentByMobile(mobileNumber: string): Promise<ChapterPracticeStudent | undefined>;
  createChapterPracticeStudent(student: InsertChapterPracticeStudent): Promise<ChapterPracticeStudent>;
  updateChapterPracticeStudent(id: number, updates: Partial<InsertChapterPracticeStudent>): Promise<ChapterPracticeStudent | undefined>;
  deleteChapterPracticeStudent(id: number): Promise<boolean>;
  getAllChapterPracticeStudents(): Promise<ChapterPracticeStudent[]>;

  // Chapter Practice Quiz Sessions
  createChapterPracticeQuizSession(session: InsertChapterPracticeQuizSession): Promise<ChapterPracticeQuizSession>;
  updateChapterPracticeQuizSession(id: number, updates: Partial<ChapterPracticeQuizSession>): Promise<ChapterPracticeQuizSession | undefined>;
  getChapterPracticeQuizSession(id: number): Promise<ChapterPracticeQuizSession | undefined>;
  getChapterPracticeStudentQuizSessions(studentId: number): Promise<ChapterPracticeQuizSession[]>;

  // Chapter Practice PDFs
  getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  getChapterPracticePdfs(): Promise<Pdf[]>;
  getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]>;
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

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    await db.delete(quizSessions).where(eq(quizSessions.studentId, id));
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // PDFs
  async getPdf(id: number): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.id, id));
    return pdf || undefined;
  }

  async getPdfByFilename(filename: string): Promise<Pdf | undefined> {
    // Only check active (non-archived) PDFs to allow re-uploading after archive
    const [pdf] = await db.select().from(pdfs).where(
      and(
        eq(pdfs.filename, filename),
        eq(pdfs.isArchived, false)
      )
    );
    return pdf || undefined;
  }

  async getAnyPdfByFilename(filename: string): Promise<Pdf | undefined> {
    // Get any PDF by filename, including archived ones (for replacement logic)
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
  }

  async replacePdf(id: number, content: string, grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    // Replace an archived PDF with new content and restore it
    const [pdf] = await db.update(pdfs)
      .set({ 
        content, 
        grade, 
        board, 
        subject, 
        isArchived: false, 
        uploadedAt: new Date(),
        parsedQuestions: null,
        totalQuestions: 0
      })
      .where(eq(pdfs.id, id))
      .returning();
    return pdf || undefined;
  }

  async getPdfByGradeBoardSubject(grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    // Get normalized grade variants (e.g., "12th" -> ["12", "12th"])
    const gradeVariants = normalizeGrade(grade);
    
    // Only return active (non-archived) PDFs for quiz generation
    const [pdf] = await db.select().from(pdfs).where(
      and(
        or(
          eq(pdfs.grade, gradeVariants[0]),
          eq(pdfs.grade, gradeVariants[1])
        ),
        eq(pdfs.board, board),
        eq(pdfs.subject, subject),
        eq(pdfs.isArchived, false)
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
    // Soft delete: archive the PDF instead of deleting it
    // This preserves quiz history and leaderboard data
    const result = await db.update(pdfs)
      .set({ isArchived: true, archivedAt: new Date() })
      .where(eq(pdfs.id, id))
      .returning();
    
    // Only delete question pointers (not quiz sessions - those are history)
    await db.delete(questionPointers).where(eq(questionPointers.pdfId, id));
    
    return result.length > 0;
  }
  
  async getActivePdfs(): Promise<Pdf[]> {
    // Get only non-archived PDFs for quiz generation
    return await db.select().from(pdfs).where(eq(pdfs.isArchived, false));
  }
  
  async restorePdf(id: number): Promise<boolean> {
    // Restore an archived PDF - clear archivedAt timestamp
    const result = await db.update(pdfs)
      .set({ isArchived: false, archivedAt: null })
      .where(eq(pdfs.id, id))
      .returning();
    return result.length > 0;
  }
  
  async cleanupOldArchivedPdfs(): Promise<number> {
    // Permanently delete PDFs that have been archived for more than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Find PDFs to delete
    const toDelete = await db.select({ id: pdfs.id }).from(pdfs).where(
      and(
        eq(pdfs.isArchived, true),
        lt(pdfs.archivedAt, threeMonthsAgo)
      )
    );
    
    if (toDelete.length === 0) {
      return 0;
    }
    
    // Set pdfId to null in quiz sessions to preserve history (orphan the reference)
    for (const pdf of toDelete) {
      await db.update(quizSessions).set({ pdfId: null }).where(eq(quizSessions.pdfId, pdf.id));
      await db.update(cpctQuizSessions).set({ pdfId: null }).where(eq(cpctQuizSessions.pdfId, pdf.id));
      await db.update(navodayaQuizSessions).set({ pdfId: null }).where(eq(navodayaQuizSessions.pdfId, pdf.id));
      await db.delete(questionPointers).where(eq(questionPointers.pdfId, pdf.id));
    }
    
    // Now permanently delete the PDFs
    const deleted = await db.delete(pdfs).where(
      and(
        eq(pdfs.isArchived, true),
        lt(pdfs.archivedAt, threeMonthsAgo)
      )
    ).returning();
    
    return deleted.length;
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

  async updateCpctStudent(id: number, updates: Partial<InsertCpctStudent>): Promise<CpctStudent | undefined> {
    const [student] = await db
      .update(cpctStudents)
      .set(updates)
      .where(eq(cpctStudents.id, id))
      .returning();
    return student || undefined;
  }

  async deleteCpctStudent(id: number): Promise<boolean> {
    await db.delete(cpctQuizSessions).where(eq(cpctQuizSessions.studentId, id));
    const result = await db.delete(cpctStudents).where(eq(cpctStudents.id, id)).returning();
    return result.length > 0;
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

  async updateNavodayaStudent(id: number, updates: Partial<InsertNavodayaStudent>): Promise<NavodayaStudent | undefined> {
    const [student] = await db
      .update(navodayaStudents)
      .set(updates)
      .where(eq(navodayaStudents.id, id))
      .returning();
    return student || undefined;
  }

  async deleteNavodayaStudent(id: number): Promise<boolean> {
    await db.delete(navodayaQuizSessions).where(eq(navodayaQuizSessions.studentId, id));
    const result = await db.delete(navodayaStudents).where(eq(navodayaStudents.id, id)).returning();
    return result.length > 0;
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
    // Also try without ordinal suffix (e.g., 6_navodaya.pdf)
    // Only return active (non-archived) PDFs
    const filename = `${examGrade}_navodaya.pdf`;
    let [pdf] = await db.select().from(pdfs).where(
      and(eq(pdfs.filename, filename), eq(pdfs.isArchived, false))
    );
    
    // Fallback: try without ordinal suffix (6th -> 6)
    if (!pdf) {
      const numericGrade = examGrade.replace(/(?:st|nd|rd|th)$/i, '');
      const fallbackFilename = `${numericGrade}_navodaya.pdf`;
      [pdf] = await db.select().from(pdfs).where(
        and(eq(pdfs.filename, fallbackFilename), eq(pdfs.isArchived, false))
      );
    }
    
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
    navodaya: LeaderboardEntry[];
  }> {
    // Board Exam Leaderboard (top 3)
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
      .limit(3);

    const boardExam: LeaderboardEntry[] = boardExamResults.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      totalScore: Number(row.totalScore),
      totalQuestions: Number(row.totalQuestions),
      accuracy: row.totalQuestions > 0 ? Math.round((Number(row.totalScore) / Number(row.totalQuestions)) * 100) : 0,
      testsCompleted: Number(row.testsCompleted),
    }));

    // CPCT Leaderboard (top 3)
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
      .limit(3);

    const cpct: LeaderboardEntry[] = cpctResults.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      totalScore: Number(row.totalScore),
      totalQuestions: Number(row.totalQuestions),
      accuracy: row.totalQuestions > 0 ? Math.round((Number(row.totalScore) / Number(row.totalQuestions)) * 100) : 0,
      testsCompleted: Number(row.testsCompleted),
    }));

    // Navodaya Leaderboard (top 3)
    const navodayaResults = await db
      .select({
        studentId: navodayaQuizSessions.studentId,
        studentName: navodayaStudents.name,
        totalScore: sql<number>`COALESCE(SUM(${navodayaQuizSessions.score}), 0)`,
        totalQuestions: sql<number>`COALESCE(SUM(${navodayaQuizSessions.totalQuestions}), 0)`,
        testsCompleted: sql<number>`COUNT(*)`,
      })
      .from(navodayaQuizSessions)
      .innerJoin(navodayaStudents, eq(navodayaQuizSessions.studentId, navodayaStudents.id))
      .where(
        and(
          isNotNull(navodayaQuizSessions.score),
          isNotNull(navodayaQuizSessions.completedAt),
          sql`${navodayaQuizSessions.totalQuestions} > 0`,
          gte(navodayaQuizSessions.completedAt, weekStartUtc),
          lte(navodayaQuizSessions.completedAt, weekEndUtc)
        )
      )
      .groupBy(navodayaQuizSessions.studentId, navodayaStudents.name)
      .orderBy(sql`(COALESCE(SUM(${navodayaQuizSessions.score}), 0)::float / NULLIF(SUM(${navodayaQuizSessions.totalQuestions}), 0)) DESC NULLS LAST`)
      .limit(3);

    const navodaya: LeaderboardEntry[] = navodayaResults.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      totalScore: Number(row.totalScore),
      totalQuestions: Number(row.totalQuestions),
      accuracy: row.totalQuestions > 0 ? Math.round((Number(row.totalScore) / Number(row.totalQuestions)) * 100) : 0,
      testsCompleted: Number(row.testsCompleted),
    }));

    return { boardExam, cpct, navodaya };
  }

  // Question Pointers (for sequential question picking)
  async getQuestionPointer(studentId: number, studentType: string, pdfId: number): Promise<QuestionPointer | undefined> {
    const [pointer] = await db.select().from(questionPointers).where(
      and(
        eq(questionPointers.studentId, studentId),
        eq(questionPointers.studentType, studentType),
        eq(questionPointers.pdfId, pdfId)
      )
    );
    return pointer || undefined;
  }

  async updateQuestionPointer(studentId: number, studentType: string, pdfId: number, lastQuestionIndex: number): Promise<QuestionPointer> {
    // Try to find existing pointer
    const existing = await this.getQuestionPointer(studentId, studentType, pdfId);
    
    if (existing) {
      // Update existing pointer
      const [updated] = await db
        .update(questionPointers)
        .set({ lastQuestionIndex, updatedAt: new Date() })
        .where(eq(questionPointers.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new pointer
      const [created] = await db
        .insert(questionPointers)
        .values({ studentId, studentType, pdfId, lastQuestionIndex })
        .returning();
      return created;
    }
  }

  // PDF parsed questions
  async updatePdfParsedQuestions(pdfId: number, parsedQuestions: ParsedQuestion[], totalQuestions: number): Promise<Pdf | undefined> {
    const [updated] = await db
      .update(pdfs)
      .set({ parsedQuestions, totalQuestions })
      .where(eq(pdfs.id, pdfId))
      .returning();
    return updated || undefined;
  }

  // Notices
  async createNotice(notice: InsertNotice): Promise<Notice> {
    const [created] = await db.insert(notices).values(notice).returning();
    return created;
  }

  async updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined> {
    const [updated] = await db
      .update(notices)
      .set(updates)
      .where(eq(notices.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id)).returning();
    return result.length > 0;
  }

  async getActiveNotices(): Promise<Notice[]> {
    const now = new Date();
    return await db.select().from(notices).where(
      and(
        eq(notices.isActive, true),
        or(
          sql`${notices.expiresAt} IS NULL`,
          gte(notices.expiresAt, now)
        )
      )
    ).orderBy(desc(notices.priority), desc(notices.createdAt));
  }

  async getAllNotices(): Promise<Notice[]> {
    return await db.select().from(notices).orderBy(desc(notices.priority), desc(notices.createdAt));
  }

  // Chapter Practice Students
  async getChapterPracticeStudent(id: number): Promise<ChapterPracticeStudent | undefined> {
    const [student] = await db.select().from(chapterPracticeStudents).where(eq(chapterPracticeStudents.id, id));
    return student || undefined;
  }

  async getChapterPracticeStudentByMobile(mobileNumber: string): Promise<ChapterPracticeStudent | undefined> {
    const [student] = await db.select().from(chapterPracticeStudents).where(eq(chapterPracticeStudents.mobileNumber, mobileNumber));
    return student || undefined;
  }

  async createChapterPracticeStudent(insertStudent: InsertChapterPracticeStudent): Promise<ChapterPracticeStudent> {
    const [student] = await db.insert(chapterPracticeStudents).values(insertStudent).returning();
    return student;
  }

  async updateChapterPracticeStudent(id: number, updates: Partial<InsertChapterPracticeStudent>): Promise<ChapterPracticeStudent | undefined> {
    const [student] = await db
      .update(chapterPracticeStudents)
      .set(updates)
      .where(eq(chapterPracticeStudents.id, id))
      .returning();
    return student || undefined;
  }

  async deleteChapterPracticeStudent(id: number): Promise<boolean> {
    await db.delete(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.studentId, id));
    const result = await db.delete(chapterPracticeStudents).where(eq(chapterPracticeStudents.id, id)).returning();
    return result.length > 0;
  }

  async getAllChapterPracticeStudents(): Promise<ChapterPracticeStudent[]> {
    return await db.select().from(chapterPracticeStudents);
  }

  // Chapter Practice Quiz Sessions
  async createChapterPracticeQuizSession(insertSession: InsertChapterPracticeQuizSession): Promise<ChapterPracticeQuizSession> {
    const [session] = await db.insert(chapterPracticeQuizSessions).values(insertSession).returning();
    return session;
  }

  async updateChapterPracticeQuizSession(id: number, updates: Partial<ChapterPracticeQuizSession>): Promise<ChapterPracticeQuizSession | undefined> {
    const [session] = await db
      .update(chapterPracticeQuizSessions)
      .set(updates)
      .where(eq(chapterPracticeQuizSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getChapterPracticeQuizSession(id: number): Promise<ChapterPracticeQuizSession | undefined> {
    const [session] = await db.select().from(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.id, id));
    return session || undefined;
  }

  async getChapterPracticeStudentQuizSessions(studentId: number): Promise<ChapterPracticeQuizSession[]> {
    return await db.select().from(chapterPracticeQuizSessions)
      .where(eq(chapterPracticeQuizSessions.studentId, studentId))
      .orderBy(desc(chapterPracticeQuizSessions.createdAt));
  }

  // Chapter Practice PDFs - look for {grade}_{board}_chapter_plan_{subject}.pdf format
  async getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    const gradeVariants = normalizeGrade(grade);
    
    // Look for PDFs with "chapter_plan" in filename that match grade, board, and subject
    const allChapterPdfs = await db.select().from(pdfs).where(
      and(
        like(pdfs.filename, '%chapter_plan%'),
        eq(pdfs.isArchived, false)
      )
    );
    
    // Find matching PDF by grade, board, and subject
    const pdf = allChapterPdfs.find(p => 
      gradeVariants.includes(p.grade.toLowerCase()) &&
      p.board.toLowerCase() === board.toLowerCase() &&
      p.subject.toLowerCase() === subject.toLowerCase()
    );
    
    if (pdf) return pdf;
    
    return undefined;
  }

  // Get all Chapter Practice PDFs (for admin section)
  async getChapterPracticePdfs(): Promise<Pdf[]> {
    // Chapter Practice PDFs have "chapter_plan" in their filename
    return await db.select().from(pdfs).where(
      and(
        like(pdfs.filename, '%chapter_plan%'),
        eq(pdfs.isArchived, false)
      )
    );
  }

  async getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]> {
    // Get all active Chapter Practice PDFs for a subject
    return await db.select().from(pdfs).where(
      and(
        like(pdfs.filename, '%chapter_plan%'),
        eq(pdfs.subject, subject),
        eq(pdfs.isArchived, false)
      )
    );
  }
}

export const storage = new DatabaseStorage();
