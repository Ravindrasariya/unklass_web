import { 
  pdfs, quizSessions, cpctQuizSessions, navodayaQuizSessions, chapterPracticeQuizSessions,
  contactSubmissions, visitorStats, uniqueVisitors, questionPointers, notices,
  unifiedStudents, studentExamProfiles,
  type Pdf, type InsertPdf,
  type QuizSession, type InsertQuizSession,
  type CpctQuizSession, type InsertCpctQuizSession,
  type NavodayaQuizSession, type InsertNavodayaQuizSession,
  type ChapterPracticeQuizSession, type InsertChapterPracticeQuizSession,
  type ContactSubmission, type InsertContactSubmission,
  type VisitorStats,
  type QuestionPointer, type ParsedQuestion,
  type Notice, type InsertNotice,
  type UnifiedStudent, type InsertUnifiedStudent,
  type StudentExamProfile, type InsertStudentExamProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, gte, lte, isNotNull, or } from "drizzle-orm";

function normalizeGrade(grade: string): string[] {
  const base = grade.replace(/(st|nd|rd|th)$/i, '').trim();
  return [base, `${base}th`];
}

export interface IStorage {
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

  // Quiz Sessions (Board Exam)
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  getStudentQuizSessions(studentId: number): Promise<QuizSession[]>;
  getStudentPreviousQuestions(studentId: number, subject: string): Promise<string[]>;

  // CPCT Quiz Sessions
  createCpctQuizSession(session: InsertCpctQuizSession): Promise<CpctQuizSession>;
  updateCpctQuizSession(id: number, updates: Partial<CpctQuizSession>): Promise<CpctQuizSession | undefined>;
  getCpctQuizSession(id: number): Promise<CpctQuizSession | undefined>;
  getCpctStudentQuizSessions(studentId: number): Promise<CpctQuizSession[]>;
  getCpctStudentPreviousQuestions(studentId: number): Promise<string[]>;
  getCpctPdf(year: string): Promise<Pdf | undefined>;

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
    navodaya: LeaderboardEntry[];
    chapterPractice: LeaderboardEntry[];
  }>;

  // Question Pointers (for sequential question picking)
  getQuestionPointer(studentId: number, pdfId: number): Promise<QuestionPointer | undefined>;
  updateQuestionPointer(studentId: number, pdfId: number, lastQuestionIndex: number): Promise<QuestionPointer>;
  
  // PDF parsed questions
  updatePdfParsedQuestions(pdfId: number, parsedQuestions: ParsedQuestion[], totalQuestions: number): Promise<Pdf | undefined>;

  // Notices
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
  getActiveNotices(): Promise<Notice[]>;
  getAllNotices(): Promise<Notice[]>;

  // Chapter Practice Quiz Sessions
  createChapterPracticeQuizSession(session: InsertChapterPracticeQuizSession): Promise<ChapterPracticeQuizSession>;
  updateChapterPracticeQuizSession(id: number, updates: Partial<ChapterPracticeQuizSession>): Promise<ChapterPracticeQuizSession | undefined>;
  getChapterPracticeQuizSession(id: number): Promise<ChapterPracticeQuizSession | undefined>;
  getChapterPracticeStudentQuizSessions(studentId: number): Promise<ChapterPracticeQuizSession[]>;
  getIncompleteChapterPracticeSession(studentId: number, chapterName: string): Promise<ChapterPracticeQuizSession | undefined>;

  // Chapter Practice PDFs
  getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  getChapterPracticePdfs(): Promise<Pdf[]>;
  getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]>;

  // Unified Students (single auth system)
  getUnifiedStudent(id: number): Promise<UnifiedStudent | undefined>;
  getUnifiedStudentByMobile(mobileNumber: string): Promise<UnifiedStudent | undefined>;
  getUnifiedStudentByNameAndMobile(name: string, mobileNumber: string): Promise<UnifiedStudent | undefined>;
  createUnifiedStudent(student: InsertUnifiedStudent): Promise<UnifiedStudent>;
  updateUnifiedStudent(id: number, updates: Partial<InsertUnifiedStudent>): Promise<UnifiedStudent | undefined>;
  deleteUnifiedStudentCascade(mobileNumber: string): Promise<boolean>;
  getAllUnifiedStudents(): Promise<UnifiedStudent[]>;

  // Student Exam Profiles (preferences per exam type)
  getStudentExamProfile(studentId: number, examType: string): Promise<StudentExamProfile | undefined>;
  upsertStudentExamProfile(studentId: number, examType: string, lastSelections: any): Promise<StudentExamProfile>;
  getStudentAllExamProfiles(studentId: number): Promise<StudentExamProfile[]>;
  
  // Unified Quiz History
  getUnifiedStudentQuizHistory(studentId: number, examType: string): Promise<any[]>;
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
  // PDFs
  async getPdf(id: number): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.id, id));
    return pdf || undefined;
  }

  async getPdfByFilename(filename: string): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(
      and(
        eq(pdfs.filename, filename),
        eq(pdfs.isArchived, false)
      )
    );
    return pdf || undefined;
  }

  async getAnyPdfByFilename(filename: string): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
  }

  async replacePdf(id: number, content: string, grade: string, board: string, subject: string): Promise<Pdf | undefined> {
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
    const gradeVariants = normalizeGrade(grade);
    
    const [pdf] = await db.select().from(pdfs).where(
      and(
        or(
          eq(pdfs.grade, gradeVariants[0]),
          eq(pdfs.grade, gradeVariants[1])
        ),
        eq(pdfs.board, board),
        eq(pdfs.subject, subject),
        eq(pdfs.isArchived, false),
        sql`${pdfs.filename} NOT ILIKE '%chapter_plan%'`
      )
    );
    return pdf || undefined;
  }

  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    const [pdf] = await db.insert(pdfs).values(insertPdf).returning();
    return pdf;
  }

  async getAllPdfs(): Promise<Pdf[]> {
    return await db.select().from(pdfs).where(
      sql`${pdfs.filename} NOT ILIKE '%chapter_plan%'`
    );
  }

  async deletePdf(id: number): Promise<boolean> {
    const result = await db.update(pdfs)
      .set({ isArchived: true, archivedAt: new Date() })
      .where(eq(pdfs.id, id))
      .returning();
    
    await db.delete(questionPointers).where(eq(questionPointers.pdfId, id));
    
    return result.length > 0;
  }
  
  async getActivePdfs(): Promise<Pdf[]> {
    return await db.select().from(pdfs).where(
      and(
        eq(pdfs.isArchived, false),
        sql`${pdfs.filename} NOT ILIKE '%chapter_plan%'`
      )
    );
  }
  
  async restorePdf(id: number): Promise<boolean> {
    const result = await db.update(pdfs)
      .set({ isArchived: false, archivedAt: null })
      .where(eq(pdfs.id, id))
      .returning();
    return result.length > 0;
  }

  // Quiz Sessions (Board Exam)
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
    const filename = `CPCT_${year}.pdf`;
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.filename, filename));
    return pdf || undefined;
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
    const filename = `${examGrade}_navodaya.pdf`;
    let [pdf] = await db.select().from(pdfs).where(
      and(eq(pdfs.filename, filename), eq(pdfs.isArchived, false))
    );
    
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
    
    if (ipAddress) {
      const existingVisit = await db.select().from(uniqueVisitors)
        .where(and(eq(uniqueVisitors.ipAddress, ipAddress), eq(uniqueVisitors.date, date)));
      
      if (existingVisit.length === 0) {
        isUniqueVisit = true;
        await db.insert(uniqueVisitors).values({ ipAddress, date });
      }
    }
    
    const existingStats = await db.select().from(visitorStats).where(eq(visitorStats.date, date));
    
    if (existingStats.length === 0) {
      const [newStats] = await db.insert(visitorStats).values({
        date,
        totalVisitors: 1,
        uniqueVisitors: isUniqueVisit ? 1 : 0,
      }).returning();
      return newStats;
    } else {
      const [updatedStats] = await db.update(visitorStats)
        .set({
          totalVisitors: sql`${visitorStats.totalVisitors} + 1`,
          uniqueVisitors: isUniqueVisit 
            ? sql`${visitorStats.uniqueVisitors} + 1` 
            : visitorStats.uniqueVisitors,
        })
        .where(eq(visitorStats.date, date))
        .returning();
      return updatedStats;
    }
  }

  async getVisitorStats(): Promise<VisitorStats[]> {
    return await db.select().from(visitorStats).orderBy(desc(visitorStats.date));
  }

  async getTotalVisitors(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${visitorStats.totalVisitors}), 0)` })
      .from(visitorStats);
    return result[0]?.total || 0;
  }

  async getTotalUniqueVisitors(): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${visitorStats.uniqueVisitors}), 0)` })
      .from(visitorStats);
    return result[0]?.total || 0;
  }

  // Leaderboard
  async getWeeklyLeaderboard(weekStartUtc: Date, weekEndUtc: Date): Promise<{
    boardExam: LeaderboardEntry[];
    cpct: LeaderboardEntry[];
    navodaya: LeaderboardEntry[];
    chapterPractice: LeaderboardEntry[];
  }> {
    const buildLeaderboard = async (
      sessionTable: any,
      getStudentName: (id: number) => Promise<string>
    ): Promise<LeaderboardEntry[]> => {
      const sessions = await db.select().from(sessionTable).where(
        and(
          isNotNull(sessionTable.completedAt),
          gte(sessionTable.completedAt, weekStartUtc),
          lte(sessionTable.completedAt, weekEndUtc)
        )
      );

      const studentStats: Record<number, { totalScore: number; totalQuestions: number; testsCompleted: number }> = {};

      for (const session of sessions) {
        const studentId = session.studentId;
        if (!studentStats[studentId]) {
          studentStats[studentId] = { totalScore: 0, totalQuestions: 0, testsCompleted: 0 };
        }
        studentStats[studentId].totalScore += session.score || 0;
        studentStats[studentId].totalQuestions += session.totalQuestions || 0;
        studentStats[studentId].testsCompleted += 1;
      }

      const leaderboard: LeaderboardEntry[] = [];
      for (const [studentIdStr, stats] of Object.entries(studentStats)) {
        const studentId = parseInt(studentIdStr);
        const studentName = await getStudentName(studentId);
        const accuracy = stats.totalQuestions > 0 
          ? Math.round((stats.totalScore / stats.totalQuestions) * 100) 
          : 0;
        
        leaderboard.push({
          rank: 0,
          studentId,
          studentName,
          accuracy,
          totalScore: stats.totalScore,
          totalQuestions: stats.totalQuestions,
          testsCompleted: stats.testsCompleted,
        });
      }

      leaderboard.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.testsCompleted !== a.testsCompleted) return b.testsCompleted - a.testsCompleted;
        return b.totalScore - a.totalScore;
      });

      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard.slice(0, 10);
    };

    const getUnifiedStudentName = async (id: number): Promise<string> => {
      const student = await this.getUnifiedStudent(id);
      return student?.name || "Unknown";
    };

    const [boardExam, cpct, navodaya, chapterPractice] = await Promise.all([
      buildLeaderboard(quizSessions, getUnifiedStudentName),
      buildLeaderboard(cpctQuizSessions, getUnifiedStudentName),
      buildLeaderboard(navodayaQuizSessions, getUnifiedStudentName),
      buildLeaderboard(chapterPracticeQuizSessions, getUnifiedStudentName),
    ]);

    return { boardExam, cpct, navodaya, chapterPractice };
  }

  // Question Pointers
  async getQuestionPointer(studentId: number, pdfId: number): Promise<QuestionPointer | undefined> {
    const [pointer] = await db.select().from(questionPointers).where(
      and(
        eq(questionPointers.studentId, studentId),
        eq(questionPointers.pdfId, pdfId)
      )
    );
    return pointer || undefined;
  }

  async updateQuestionPointer(studentId: number, pdfId: number, lastQuestionIndex: number): Promise<QuestionPointer> {
    const existing = await this.getQuestionPointer(studentId, pdfId);
    
    if (existing) {
      const [updated] = await db.update(questionPointers)
        .set({ lastQuestionIndex, updatedAt: new Date() })
        .where(eq(questionPointers.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(questionPointers)
        .values({ studentId, pdfId, lastQuestionIndex })
        .returning();
      return created;
    }
  }

  // PDF parsed questions
  async updatePdfParsedQuestions(pdfId: number, parsedQuestions: ParsedQuestion[], totalQuestions: number): Promise<Pdf | undefined> {
    const [pdf] = await db.update(pdfs)
      .set({ parsedQuestions, totalQuestions })
      .where(eq(pdfs.id, pdfId))
      .returning();
    return pdf || undefined;
  }

  // Notices
  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db.insert(notices).values(insertNotice).returning();
    return notice;
  }

  async updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined> {
    const [notice] = await db.update(notices)
      .set(updates)
      .where(eq(notices.id, id))
      .returning();
    return notice || undefined;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id)).returning();
    return result.length > 0;
  }

  async getActiveNotices(): Promise<Notice[]> {
    return await db.select().from(notices).where(
      and(
        eq(notices.isActive, true),
        or(
          sql`${notices.expiresAt} IS NULL`,
          gte(notices.expiresAt, new Date())
        )
      )
    ).orderBy(desc(notices.priority), desc(notices.createdAt));
  }

  async getAllNotices(): Promise<Notice[]> {
    return await db.select().from(notices).orderBy(desc(notices.createdAt));
  }

  // Chapter Practice Quiz Sessions
  async createChapterPracticeQuizSession(insertSession: InsertChapterPracticeQuizSession): Promise<ChapterPracticeQuizSession> {
    const [session] = await db.insert(chapterPracticeQuizSessions).values(insertSession).returning();
    return session;
  }

  async updateChapterPracticeQuizSession(id: number, updates: Partial<ChapterPracticeQuizSession>): Promise<ChapterPracticeQuizSession | undefined> {
    const [session] = await db.update(chapterPracticeQuizSessions)
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

  async getIncompleteChapterPracticeSession(studentId: number, chapterName: string): Promise<ChapterPracticeQuizSession | undefined> {
    const [session] = await db.select().from(chapterPracticeQuizSessions)
      .where(
        and(
          eq(chapterPracticeQuizSessions.studentId, studentId),
          eq(chapterPracticeQuizSessions.chapterName, chapterName),
          sql`${chapterPracticeQuizSessions.completedAt} IS NULL`
        )
      )
      .orderBy(desc(chapterPracticeQuizSessions.createdAt))
      .limit(1);
    return session || undefined;
  }

  // Chapter Practice PDFs
  async getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    const gradeVariants = normalizeGrade(grade);
    const boardPattern = `${board}_Chapter_Plan`;
    
    const [pdf] = await db.select().from(pdfs).where(
      and(
        or(
          eq(pdfs.grade, gradeVariants[0]),
          eq(pdfs.grade, gradeVariants[1])
        ),
        eq(pdfs.board, boardPattern),
        eq(pdfs.subject, subject),
        eq(pdfs.isArchived, false)
      )
    );
    return pdf || undefined;
  }

  async getChapterPracticePdfs(): Promise<Pdf[]> {
    return await db.select().from(pdfs).where(
      sql`${pdfs.filename} ILIKE '%chapter_plan%'`
    );
  }

  async getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]> {
    return await db.select().from(pdfs).where(
      and(
        eq(pdfs.subject, subject),
        sql`${pdfs.filename} ILIKE '%chapter_plan%'`
      )
    );
  }

  // Unified Students
  async getUnifiedStudent(id: number): Promise<UnifiedStudent | undefined> {
    const [student] = await db.select().from(unifiedStudents).where(eq(unifiedStudents.id, id));
    return student || undefined;
  }

  async getUnifiedStudentByMobile(mobileNumber: string): Promise<UnifiedStudent | undefined> {
    const [student] = await db.select().from(unifiedStudents).where(eq(unifiedStudents.mobileNumber, mobileNumber));
    return student || undefined;
  }

  async getUnifiedStudentByNameAndMobile(name: string, mobileNumber: string): Promise<UnifiedStudent | undefined> {
    const [student] = await db.select().from(unifiedStudents).where(
      and(
        sql`LOWER(${unifiedStudents.name}) = LOWER(${name})`,
        eq(unifiedStudents.mobileNumber, mobileNumber)
      )
    );
    return student || undefined;
  }

  async createUnifiedStudent(insertStudent: InsertUnifiedStudent): Promise<UnifiedStudent> {
    const [student] = await db.insert(unifiedStudents).values(insertStudent).returning();
    return student;
  }

  async updateUnifiedStudent(id: number, updates: Partial<InsertUnifiedStudent>): Promise<UnifiedStudent | undefined> {
    const [student] = await db.update(unifiedStudents)
      .set(updates)
      .where(eq(unifiedStudents.id, id))
      .returning();
    return student || undefined;
  }

  async deleteUnifiedStudentCascade(mobileNumber: string): Promise<boolean> {
    const student = await this.getUnifiedStudentByMobile(mobileNumber);
    if (!student) return false;

    await db.delete(studentExamProfiles).where(eq(studentExamProfiles.studentId, student.id));
    await db.delete(quizSessions).where(eq(quizSessions.studentId, student.id));
    await db.delete(cpctQuizSessions).where(eq(cpctQuizSessions.studentId, student.id));
    await db.delete(navodayaQuizSessions).where(eq(navodayaQuizSessions.studentId, student.id));
    await db.delete(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.studentId, student.id));
    await db.delete(questionPointers).where(eq(questionPointers.studentId, student.id));
    
    const result = await db.delete(unifiedStudents).where(eq(unifiedStudents.id, student.id)).returning();
    return result.length > 0;
  }

  async getAllUnifiedStudents(): Promise<UnifiedStudent[]> {
    return await db.select().from(unifiedStudents).orderBy(desc(unifiedStudents.createdAt));
  }

  // Student Exam Profiles
  async getStudentExamProfile(studentId: number, examType: string): Promise<StudentExamProfile | undefined> {
    const [profile] = await db.select().from(studentExamProfiles).where(
      and(
        eq(studentExamProfiles.studentId, studentId),
        eq(studentExamProfiles.examType, examType)
      )
    );
    return profile || undefined;
  }

  async upsertStudentExamProfile(studentId: number, examType: string, lastSelections: any): Promise<StudentExamProfile> {
    const existing = await this.getStudentExamProfile(studentId, examType);
    
    if (existing) {
      const [updated] = await db.update(studentExamProfiles)
        .set({ lastSelections, updatedAt: new Date() })
        .where(eq(studentExamProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(studentExamProfiles)
        .values({ studentId, examType, lastSelections })
        .returning();
      return created;
    }
  }

  async getStudentAllExamProfiles(studentId: number): Promise<StudentExamProfile[]> {
    return await db.select().from(studentExamProfiles).where(eq(studentExamProfiles.studentId, studentId));
  }

  // Unified Quiz History
  async getUnifiedStudentQuizHistory(studentId: number, examType: string): Promise<any[]> {
    switch (examType) {
      case 'board':
        return await this.getStudentQuizSessions(studentId);
      case 'cpct':
        return await this.getCpctStudentQuizSessions(studentId);
      case 'navodaya':
        return await this.getNavodayaStudentQuizSessions(studentId);
      case 'chapter_practice':
        return await this.getChapterPracticeStudentQuizSessions(studentId);
      default:
        return [];
    }
  }
}

export const storage = new DatabaseStorage();
