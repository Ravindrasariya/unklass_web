import { 
  students, pdfs, quizSessions, cpctStudents, cpctQuizSessions,
  navodayaStudents, navodayaQuizSessions, chapterPracticeStudents, chapterPracticeQuizSessions,
  contactSubmissions, visitorStats, uniqueVisitors, questionPointers, notices,
  unifiedStudents, studentExamProfiles,
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
  type Notice, type InsertNotice,
  type UnifiedStudent, type InsertUnifiedStudent,
  type StudentExamProfile, type InsertStudentExamProfile,
  type ExamType
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

  // Quiz Sessions
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  getStudentQuizSessions(studentId: number): Promise<QuizSession[]>;
  getQuizSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<QuizSession[]>;
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
  getCpctSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<CpctQuizSession[]>;
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
  getNavodayaSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<NavodayaQuizSession[]>;
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
  getChapterPracticeSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<ChapterPracticeQuizSession[]>;
  getIncompleteChapterPracticeSession(studentId: number, chapterName: string): Promise<ChapterPracticeQuizSession | undefined>;

  // Chapter Practice PDFs
  getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined>;
  getChapterPracticePdfs(): Promise<Pdf[]>;
  getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]>;

  // Unified Students (new auth system)
  getUnifiedStudent(id: number): Promise<UnifiedStudent | undefined>;
  getUnifiedStudentByMobile(mobileNumber: string): Promise<UnifiedStudent | undefined>;
  getUnifiedStudentByNameAndMobile(name: string, mobileNumber: string): Promise<UnifiedStudent | undefined>;
  createUnifiedStudent(student: InsertUnifiedStudent): Promise<UnifiedStudent>;
  updateUnifiedStudent(id: number, updates: Partial<InsertUnifiedStudent>): Promise<UnifiedStudent | undefined>;
  deleteUnifiedStudentCascade(mobileNumber: string): Promise<boolean>;
  deleteUnifiedStudentById(id: number): Promise<boolean>;
  getAllUnifiedStudents(): Promise<UnifiedStudent[]>;

  // Student Exam Profiles (preferences per exam type)
  getStudentExamProfile(studentId: number, examType: string): Promise<StudentExamProfile | undefined>;
  upsertStudentExamProfile(studentId: number, examType: string, lastSelections: any): Promise<StudentExamProfile>;
  getStudentAllExamProfiles(studentId: number): Promise<StudentExamProfile[]>;
  
  // Legacy user lookup and auto-migration
  findAndMigrateLegacyUser(name: string, mobileNumber: string): Promise<UnifiedStudent | null>;
  
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
    // Exclude Chapter Practice PDFs (those have "chapter_plan" in filename)
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
    // Exclude Chapter Practice PDFs (those with "chapter_plan" in filename)
    // They are shown in a separate section
    return await db.select().from(pdfs).where(
      sql`${pdfs.filename} NOT ILIKE '%chapter_plan%'`
    );
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
    // Exclude Chapter Practice PDFs (they have their own dedicated section)
    return await db.select().from(pdfs).where(
      and(
        eq(pdfs.isArchived, false),
        sql`${pdfs.filename} NOT ILIKE '%chapter_plan%'`
      )
    );
  }
  
  async restorePdf(id: number): Promise<boolean> {
    // Restore an archived PDF - clear archivedAt timestamp
    const result = await db.update(pdfs)
      .set({ isArchived: false, archivedAt: null })
      .where(eq(pdfs.id, id))
      .returning();
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

  async getQuizSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<QuizSession[]> {
    return await db.select().from(quizSessions)
      .where(eq(quizSessions.unifiedStudentId, unifiedStudentId))
      .orderBy(desc(quizSessions.createdAt));
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

  async getCpctSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<CpctQuizSession[]> {
    return await db.select().from(cpctQuizSessions)
      .where(eq(cpctQuizSessions.unifiedStudentId, unifiedStudentId))
      .orderBy(desc(cpctQuizSessions.createdAt));
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

  async getNavodayaSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<NavodayaQuizSession[]> {
    return await db.select().from(navodayaQuizSessions)
      .where(eq(navodayaQuizSessions.unifiedStudentId, unifiedStudentId))
      .orderBy(desc(navodayaQuizSessions.createdAt));
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
    chapterPractice: LeaderboardEntry[];
  }> {
    // Board Exam Leaderboard (top 3) - includes both legacy and unified students
    // Use raw SQL to UNION legacy students and unified students
    const boardExamResults = await db.execute(sql`
      WITH all_board_sessions AS (
        -- Legacy students
        SELECT 
          qs.student_id as student_id,
          s.name as student_name,
          qs.score,
          qs.total_questions,
          'legacy' as source
        FROM quiz_sessions qs
        INNER JOIN students s ON qs.student_id = s.id
        WHERE qs.score IS NOT NULL 
          AND qs.completed_at IS NOT NULL
          AND qs.total_questions > 0
          AND qs.completed_at >= ${weekStartUtc}
          AND qs.completed_at <= ${weekEndUtc}
        
        UNION ALL
        
        -- Unified students
        SELECT 
          qs.unified_student_id as student_id,
          us.name as student_name,
          qs.score,
          qs.total_questions,
          'unified' as source
        FROM quiz_sessions qs
        INNER JOIN unified_students us ON qs.unified_student_id = us.id
        WHERE qs.unified_student_id IS NOT NULL
          AND qs.score IS NOT NULL 
          AND qs.completed_at IS NOT NULL
          AND qs.total_questions > 0
          AND qs.completed_at >= ${weekStartUtc}
          AND qs.completed_at <= ${weekEndUtc}
      )
      SELECT 
        student_id,
        student_name,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(total_questions), 0) as total_questions,
        COUNT(*) as tests_completed
      FROM all_board_sessions
      GROUP BY student_id, student_name
      ORDER BY (COALESCE(SUM(score), 0)::float / NULLIF(SUM(total_questions), 0)) DESC NULLS LAST
      LIMIT 3
    `);

    const boardExam: LeaderboardEntry[] = (boardExamResults.rows as any[]).map((row, index) => ({
      rank: index + 1,
      studentId: row.student_id,
      studentName: row.student_name,
      totalScore: Number(row.total_score),
      totalQuestions: Number(row.total_questions),
      accuracy: row.total_questions > 0 ? Math.round((Number(row.total_score) / Number(row.total_questions)) * 100) : 0,
      testsCompleted: Number(row.tests_completed),
    }));

    // CPCT Leaderboard (top 3) - includes both legacy and unified students
    const cpctResults = await db.execute(sql`
      WITH all_cpct_sessions AS (
        -- Legacy students
        SELECT 
          cs.student_id as student_id,
          s.name as student_name,
          cs.score,
          cs.total_questions
        FROM cpct_quiz_sessions cs
        INNER JOIN cpct_students s ON cs.student_id = s.id
        WHERE cs.score IS NOT NULL 
          AND cs.completed_at IS NOT NULL
          AND cs.total_questions > 0
          AND cs.completed_at >= ${weekStartUtc}
          AND cs.completed_at <= ${weekEndUtc}
        
        UNION ALL
        
        -- Unified students
        SELECT 
          cs.unified_student_id as student_id,
          us.name as student_name,
          cs.score,
          cs.total_questions
        FROM cpct_quiz_sessions cs
        INNER JOIN unified_students us ON cs.unified_student_id = us.id
        WHERE cs.unified_student_id IS NOT NULL
          AND cs.score IS NOT NULL 
          AND cs.completed_at IS NOT NULL
          AND cs.total_questions > 0
          AND cs.completed_at >= ${weekStartUtc}
          AND cs.completed_at <= ${weekEndUtc}
      )
      SELECT 
        student_id,
        student_name,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(total_questions), 0) as total_questions,
        COUNT(*) as tests_completed
      FROM all_cpct_sessions
      GROUP BY student_id, student_name
      ORDER BY (COALESCE(SUM(score), 0)::float / NULLIF(SUM(total_questions), 0)) DESC NULLS LAST
      LIMIT 3
    `);

    const cpct: LeaderboardEntry[] = (cpctResults.rows as any[]).map((row, index) => ({
      rank: index + 1,
      studentId: row.student_id,
      studentName: row.student_name,
      totalScore: Number(row.total_score),
      totalQuestions: Number(row.total_questions),
      accuracy: row.total_questions > 0 ? Math.round((Number(row.total_score) / Number(row.total_questions)) * 100) : 0,
      testsCompleted: Number(row.tests_completed),
    }));

    // Navodaya Leaderboard (top 3) - includes both legacy and unified students
    const navodayaResults = await db.execute(sql`
      WITH all_navodaya_sessions AS (
        -- Legacy students
        SELECT 
          ns.student_id as student_id,
          s.name as student_name,
          ns.score,
          ns.total_questions
        FROM navodaya_quiz_sessions ns
        INNER JOIN navodaya_students s ON ns.student_id = s.id
        WHERE ns.score IS NOT NULL 
          AND ns.completed_at IS NOT NULL
          AND ns.total_questions > 0
          AND ns.completed_at >= ${weekStartUtc}
          AND ns.completed_at <= ${weekEndUtc}
        
        UNION ALL
        
        -- Unified students
        SELECT 
          ns.unified_student_id as student_id,
          us.name as student_name,
          ns.score,
          ns.total_questions
        FROM navodaya_quiz_sessions ns
        INNER JOIN unified_students us ON ns.unified_student_id = us.id
        WHERE ns.unified_student_id IS NOT NULL
          AND ns.score IS NOT NULL 
          AND ns.completed_at IS NOT NULL
          AND ns.total_questions > 0
          AND ns.completed_at >= ${weekStartUtc}
          AND ns.completed_at <= ${weekEndUtc}
      )
      SELECT 
        student_id,
        student_name,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(total_questions), 0) as total_questions,
        COUNT(*) as tests_completed
      FROM all_navodaya_sessions
      GROUP BY student_id, student_name
      ORDER BY (COALESCE(SUM(score), 0)::float / NULLIF(SUM(total_questions), 0)) DESC NULLS LAST
      LIMIT 3
    `);

    const navodaya: LeaderboardEntry[] = (navodayaResults.rows as any[]).map((row, index) => ({
      rank: index + 1,
      studentId: row.student_id,
      studentName: row.student_name,
      totalScore: Number(row.total_score),
      totalQuestions: Number(row.total_questions),
      accuracy: row.total_questions > 0 ? Math.round((Number(row.total_score) / Number(row.total_questions)) * 100) : 0,
      testsCompleted: Number(row.tests_completed),
    }));

    // Chapter Practice Leaderboard (top 3) - includes both legacy and unified students
    const chapterPracticeResults = await db.execute(sql`
      WITH all_chapter_sessions AS (
        -- Legacy students
        SELECT 
          cps.student_id as student_id,
          s.name as student_name,
          cps.score,
          cps.total_questions
        FROM chapter_practice_quiz_sessions cps
        INNER JOIN chapter_practice_students s ON cps.student_id = s.id
        WHERE cps.score IS NOT NULL 
          AND cps.completed_at IS NOT NULL
          AND cps.total_questions > 0
          AND cps.completed_at >= ${weekStartUtc}
          AND cps.completed_at <= ${weekEndUtc}
        
        UNION ALL
        
        -- Unified students
        SELECT 
          cps.unified_student_id as student_id,
          us.name as student_name,
          cps.score,
          cps.total_questions
        FROM chapter_practice_quiz_sessions cps
        INNER JOIN unified_students us ON cps.unified_student_id = us.id
        WHERE cps.unified_student_id IS NOT NULL
          AND cps.score IS NOT NULL 
          AND cps.completed_at IS NOT NULL
          AND cps.total_questions > 0
          AND cps.completed_at >= ${weekStartUtc}
          AND cps.completed_at <= ${weekEndUtc}
      )
      SELECT 
        student_id,
        student_name,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(total_questions), 0) as total_questions,
        COUNT(*) as tests_completed
      FROM all_chapter_sessions
      GROUP BY student_id, student_name
      ORDER BY (COALESCE(SUM(score), 0)::float / NULLIF(SUM(total_questions), 0)) DESC NULLS LAST
      LIMIT 3
    `);

    const chapterPractice: LeaderboardEntry[] = (chapterPracticeResults.rows as any[]).map((row, index) => ({
      rank: index + 1,
      studentId: row.student_id,
      studentName: row.student_name,
      totalScore: Number(row.total_score),
      totalQuestions: Number(row.total_questions),
      accuracy: row.total_questions > 0 ? Math.round((Number(row.total_score) / Number(row.total_questions)) * 100) : 0,
      testsCompleted: Number(row.tests_completed),
    }));

    return { boardExam, cpct, navodaya, chapterPractice };
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

  async getChapterPracticeSessionsByUnifiedStudentId(unifiedStudentId: number): Promise<ChapterPracticeQuizSession[]> {
    return await db.select().from(chapterPracticeQuizSessions)
      .where(eq(chapterPracticeQuizSessions.unifiedStudentId, unifiedStudentId))
      .orderBy(desc(chapterPracticeQuizSessions.createdAt));
  }

  async getIncompleteChapterPracticeSession(studentId: number, chapterName: string): Promise<ChapterPracticeQuizSession | undefined> {
    // Find the most recent incomplete session for this student + chapter
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

  // Chapter Practice PDFs - look for {grade}_{board}_chapter_plan_{subject}.pdf format
  async getChapterPracticePdf(grade: string, board: string, subject: string): Promise<Pdf | undefined> {
    const gradeVariants = normalizeGrade(grade);
    
    // Look for PDFs with "chapter_plan" in filename that match grade, board, and subject
    // Use ILIKE for case-insensitive matching (handles Chapter_Plan, chapter_plan, etc.)
    const allChapterPdfs = await db.select().from(pdfs).where(
      and(
        sql`${pdfs.filename} ILIKE '%chapter_plan%'`,
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
    // Use ILIKE for case-insensitive matching (handles Chapter_Plan, chapter_plan, etc.)
    return await db.select().from(pdfs).where(
      and(
        sql`${pdfs.filename} ILIKE '%chapter_plan%'`,
        eq(pdfs.isArchived, false)
      )
    );
  }

  async getChapterPracticePdfsForSubject(subject: string): Promise<Pdf[]> {
    // Get all active Chapter Practice PDFs for a subject
    // Use ILIKE for case-insensitive matching
    return await db.select().from(pdfs).where(
      and(
        sql`${pdfs.filename} ILIKE '%chapter_plan%'`,
        eq(pdfs.subject, subject),
        eq(pdfs.isArchived, false)
      )
    );
  }

  // Unified Students (new auth system)
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
    const [student] = await db
      .update(unifiedStudents)
      .set(updates)
      .where(eq(unifiedStudents.id, id))
      .returning();
    return student || undefined;
  }

  async getAllUnifiedStudents(): Promise<UnifiedStudent[]> {
    return await db.select().from(unifiedStudents).orderBy(desc(unifiedStudents.createdAt));
  }

  async deleteUnifiedStudentCascade(mobileNumber: string): Promise<boolean> {
    // Find all students with this mobile number across all tables
    const [unifiedStudent] = await db.select().from(unifiedStudents).where(eq(unifiedStudents.mobileNumber, mobileNumber));
    const [boardStudent] = await db.select().from(students).where(eq(students.mobileNumber, mobileNumber));
    const [cpctStudent] = await db.select().from(cpctStudents).where(eq(cpctStudents.mobileNumber, mobileNumber));
    const [navodayaStudent] = await db.select().from(navodayaStudents).where(eq(navodayaStudents.mobileNumber, mobileNumber));
    const [chapterStudent] = await db.select().from(chapterPracticeStudents).where(eq(chapterPracticeStudents.mobileNumber, mobileNumber));

    // Delete related quiz sessions first, then students
    if (boardStudent) {
      await db.delete(quizSessions).where(eq(quizSessions.studentId, boardStudent.id));
      await db.delete(questionPointers).where(and(eq(questionPointers.studentId, boardStudent.id), eq(questionPointers.studentType, 'board')));
      await db.delete(students).where(eq(students.id, boardStudent.id));
    }

    if (cpctStudent) {
      await db.delete(cpctQuizSessions).where(eq(cpctQuizSessions.studentId, cpctStudent.id));
      await db.delete(questionPointers).where(and(eq(questionPointers.studentId, cpctStudent.id), eq(questionPointers.studentType, 'cpct')));
      await db.delete(cpctStudents).where(eq(cpctStudents.id, cpctStudent.id));
    }

    if (navodayaStudent) {
      await db.delete(navodayaQuizSessions).where(eq(navodayaQuizSessions.studentId, navodayaStudent.id));
      await db.delete(questionPointers).where(and(eq(questionPointers.studentId, navodayaStudent.id), eq(questionPointers.studentType, 'navodaya')));
      await db.delete(navodayaStudents).where(eq(navodayaStudents.id, navodayaStudent.id));
    }

    if (chapterStudent) {
      await db.delete(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.studentId, chapterStudent.id));
      await db.delete(questionPointers).where(and(eq(questionPointers.studentId, chapterStudent.id), eq(questionPointers.studentType, 'chapter_practice')));
      await db.delete(chapterPracticeStudents).where(eq(chapterPracticeStudents.id, chapterStudent.id));
    }

    if (unifiedStudent) {
      // Delete quiz sessions that reference this unified student via unifiedStudentId
      await db.delete(quizSessions).where(eq(quizSessions.unifiedStudentId, unifiedStudent.id));
      await db.delete(cpctQuizSessions).where(eq(cpctQuizSessions.unifiedStudentId, unifiedStudent.id));
      await db.delete(navodayaQuizSessions).where(eq(navodayaQuizSessions.unifiedStudentId, unifiedStudent.id));
      await db.delete(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.unifiedStudentId, unifiedStudent.id));
      // Delete exam profiles for this unified student
      await db.delete(studentExamProfiles).where(eq(studentExamProfiles.studentId, unifiedStudent.id));
      await db.delete(unifiedStudents).where(eq(unifiedStudents.id, unifiedStudent.id));
    }

    return !!(unifiedStudent || boardStudent || cpctStudent || navodayaStudent || chapterStudent);
  }

  async deleteUnifiedStudentById(id: number): Promise<boolean> {
    // Get the unified student to find their mobile for cascade
    const [unifiedStudent] = await db.select().from(unifiedStudents).where(eq(unifiedStudents.id, id));
    if (!unifiedStudent) return false;
    
    // Delete quiz sessions that reference this unified student via unifiedStudentId
    await db.delete(quizSessions).where(eq(quizSessions.unifiedStudentId, id));
    await db.delete(cpctQuizSessions).where(eq(cpctQuizSessions.unifiedStudentId, id));
    await db.delete(navodayaQuizSessions).where(eq(navodayaQuizSessions.unifiedStudentId, id));
    await db.delete(chapterPracticeQuizSessions).where(eq(chapterPracticeQuizSessions.unifiedStudentId, id));
    // Delete exam profiles for this unified student
    await db.delete(studentExamProfiles).where(eq(studentExamProfiles.studentId, id));
    // Delete the unified student
    const result = await db.delete(unifiedStudents).where(eq(unifiedStudents.id, id)).returning();
    return result.length > 0;
  }

  // Student Exam Profiles (preferences per exam type)
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
      const [updated] = await db
        .update(studentExamProfiles)
        .set({ lastSelections, updatedAt: new Date() })
        .where(eq(studentExamProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(studentExamProfiles)
        .values({ studentId, examType, lastSelections })
        .returning();
      return created;
    }
  }

  async getStudentAllExamProfiles(studentId: number): Promise<StudentExamProfile[]> {
    return await db.select().from(studentExamProfiles).where(eq(studentExamProfiles.studentId, studentId));
  }

  async findAndMigrateLegacyUser(name: string, mobileNumber: string): Promise<UnifiedStudent | null> {
    // Search in legacy tables for existing user
    // Check students (board exam)
    const [boardStudent] = await db.select().from(students).where(
      and(
        sql`LOWER(${students.name}) = LOWER(${name})`,
        eq(students.mobileNumber, mobileNumber)
      )
    );
    if (boardStudent) {
      // Create unified student from board student data
      const newUnified = await this.createUnifiedStudent({
        name: boardStudent.name,
        fatherName: null, // Not available in legacy
        location: boardStudent.location,
        mobileNumber: boardStudent.mobileNumber,
        schoolName: null,
        dateOfBirth: null,
      });
      return newUnified;
    }

    // Check cpctStudents
    const [cpctStudent] = await db.select().from(cpctStudents).where(
      and(
        sql`LOWER(${cpctStudents.name}) = LOWER(${name})`,
        eq(cpctStudents.mobileNumber, mobileNumber)
      )
    );
    if (cpctStudent) {
      const newUnified = await this.createUnifiedStudent({
        name: cpctStudent.name,
        fatherName: null,
        location: cpctStudent.location,
        mobileNumber: cpctStudent.mobileNumber,
        schoolName: null,
        dateOfBirth: null,
      });
      return newUnified;
    }

    // Check navodayaStudents
    const [navodayaStudent] = await db.select().from(navodayaStudents).where(
      and(
        sql`LOWER(${navodayaStudents.name}) = LOWER(${name})`,
        eq(navodayaStudents.mobileNumber, mobileNumber)
      )
    );
    if (navodayaStudent) {
      const newUnified = await this.createUnifiedStudent({
        name: navodayaStudent.name,
        fatherName: null,
        location: navodayaStudent.location,
        mobileNumber: navodayaStudent.mobileNumber,
        schoolName: null,
        dateOfBirth: null,
      });
      return newUnified;
    }

    // Check chapterPracticeStudents
    const [chapterStudent] = await db.select().from(chapterPracticeStudents).where(
      and(
        sql`LOWER(${chapterPracticeStudents.name}) = LOWER(${name})`,
        eq(chapterPracticeStudents.mobileNumber, mobileNumber)
      )
    );
    if (chapterStudent) {
      const newUnified = await this.createUnifiedStudent({
        name: chapterStudent.name,
        fatherName: null,
        location: chapterStudent.location,
        mobileNumber: chapterStudent.mobileNumber,
        schoolName: chapterStudent.schoolName || null,
        dateOfBirth: null,
      });
      return newUnified;
    }

    return null;
  }

  async getUnifiedStudentQuizHistory(studentId: number, examType: string): Promise<any[]> {
    if (examType === "board") {
      return await db.select().from(quizSessions)
        .where(eq(quizSessions.unifiedStudentId, studentId))
        .orderBy(desc(quizSessions.completedAt));
    } else if (examType === "cpct") {
      return await db.select().from(cpctQuizSessions)
        .where(eq(cpctQuizSessions.unifiedStudentId, studentId))
        .orderBy(desc(cpctQuizSessions.completedAt));
    } else if (examType === "navodaya") {
      return await db.select().from(navodayaQuizSessions)
        .where(eq(navodayaQuizSessions.unifiedStudentId, studentId))
        .orderBy(desc(navodayaQuizSessions.completedAt));
    } else if (examType === "chapter-practice") {
      return await db.select().from(chapterPracticeQuizSessions)
        .where(eq(chapterPracticeQuizSessions.unifiedStudentId, studentId))
        .orderBy(desc(chapterPracticeQuizSessions.completedAt));
    }
    return [];
  }
}

export const storage = new DatabaseStorage();
