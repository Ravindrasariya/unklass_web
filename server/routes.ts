import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertCpctStudentSchema, insertNavodayaStudentSchema, insertContactSubmissionSchema, insertNoticeSchema, insertUnifiedStudentSchema, NAVODAYA_SECTIONS_6TH, NAVODAYA_SECTIONS_9TH, type Question, type ParsedQuestion, type ExamType } from "@shared/schema";
import { generateQuizQuestions, generateAnswerFeedback, generateCpctQuizQuestions, generateNavodayaQuizQuestions } from "./openai";
import { parseQuestionsFromPdfContent, getSequentialQuestions } from "./questionParser";
import multer from "multer";
import { z } from "zod";

async function parsePdf(buffer: Buffer): Promise<string> {
  // Use dynamic import to handle both ESM and bundled CJS environments
  // pdf-parse has a bug where it tries to load a test file on import
  // We work around this by importing the internal module directly
  const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = pdfParseModule.default ?? pdfParseModule;
  const data = await pdfParse(buffer);
  return data.text;
}

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        console.error("ADMIN_PASSWORD environment variable not set");
        return res.status(500).json({ success: false, error: "Admin password not configured" });
      }
      
      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, error: "Authentication failed" });
    }
  });

  // ==================== UNIFIED AUTH SYSTEM ====================

  // Unified student registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUnifiedStudentSchema.parse(req.body);
      
      // Check if student already exists by mobile number
      const existingStudent = await storage.getUnifiedStudentByMobile(validatedData.mobileNumber);
      if (existingStudent) {
        return res.status(400).json({ error: "A student with this mobile number is already registered. Please login instead." });
      }
      
      const student = await storage.createUnifiedStudent(validatedData);
      res.json(student);
    } catch (error: unknown) {
      console.error("Error registering unified student:", error);
      const message = error instanceof Error ? error.message : "Failed to register student";
      res.status(400).json({ error: message });
    }
  });

  // Unified student login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { name, mobileNumber } = req.body;
      
      if (!name || !mobileNumber) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }
      
      const student = await storage.getUnifiedStudentByNameAndMobile(name, mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number, or register if you're new." });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error logging in unified student:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get unified student by ID
  app.get("/api/auth/student/:id", async (req, res) => {
    try {
      const student = await storage.getUnifiedStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching unified student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // Get student exam profile (preferences for a specific exam type)
  app.get("/api/auth/student/:id/profile/:examType", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const examType = req.params.examType;
      
      const profile = await storage.getStudentExamProfile(studentId, examType);
      res.json(profile || { lastSelections: null });
    } catch (error) {
      console.error("Error fetching exam profile:", error);
      res.status(500).json({ error: "Failed to fetch exam profile" });
    }
  });

  // Update student exam profile (save preferences for a specific exam type)
  app.post("/api/auth/student/:id/profile/:examType", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const examType = req.params.examType;
      const { lastSelections } = req.body;
      
      const profile = await storage.upsertStudentExamProfile(studentId, examType, lastSelections);
      res.json(profile);
    } catch (error) {
      console.error("Error updating exam profile:", error);
      res.status(500).json({ error: "Failed to update exam profile" });
    }
  });

  // Get all exam profiles for a student
  app.get("/api/auth/student/:id/profiles", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const profiles = await storage.getStudentAllExamProfiles(studentId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching all exam profiles:", error);
      res.status(500).json({ error: "Failed to fetch exam profiles" });
    }
  });

  // Get unified student quiz history (board exam)
  app.get("/api/unified/students/:studentId/quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getUnifiedStudentQuizHistory(studentId, "board");
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching unified quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Get unified student quiz history (CPCT)
  app.get("/api/unified/students/:studentId/cpct-quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getUnifiedStudentQuizHistory(studentId, "cpct");
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching unified CPCT quiz history:", error);
      res.status(500).json({ error: "Failed to fetch CPCT quiz history" });
    }
  });

  // Get unified student quiz history (Navodaya)
  app.get("/api/unified/students/:studentId/navodaya-quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getUnifiedStudentQuizHistory(studentId, "navodaya");
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching unified Navodaya quiz history:", error);
      res.status(500).json({ error: "Failed to fetch Navodaya quiz history" });
    }
  });

  // ==================== LEGACY STUDENT ROUTES ====================

  // Student registration
  app.post("/api/students/register", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Check if student already exists by mobile number
      const existingStudent = await storage.getStudentByMobile(validatedData.mobileNumber);
      if (existingStudent) {
        return res.json(existingStudent);
      }
      
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error: unknown) {
      console.error("Error registering student:", error);
      const message = error instanceof Error ? error.message : "Failed to register student";
      res.status(400).json({ error: message });
    }
  });

  // Student login (for returning students)
  app.post("/api/students/login", async (req, res) => {
    try {
      const { name, mobileNumber } = req.body;
      
      if (!name || !mobileNumber) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }
      
      const student = await storage.getStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      // Verify name matches (case-insensitive, trimmed)
      if (student.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error logging in student:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get student by ID
  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // Get available subjects for a grade and board (subjects that have PDFs uploaded)
  app.get("/api/available-subjects", async (req, res) => {
    try {
      const { grade, board } = req.query;
      
      if (!grade || !board) {
        return res.status(400).json({ error: "Grade and board are required" });
      }
      
      const allPdfs = await storage.getActivePdfs();
      const availableSubjects = allPdfs
        .filter(pdf => pdf.grade === grade && pdf.board === board)
        .map(pdf => pdf.subject);
      
      res.json({ subjects: availableSubjects });
    } catch (error) {
      console.error("Error fetching available subjects:", error);
      res.status(500).json({ error: "Failed to fetch available subjects" });
    }
  });

  // Get available subjects with path params (for frontend query key compatibility)
  app.get("/api/available-subjects/:grade/:board", async (req, res) => {
    try {
      const { grade, board } = req.params;
      
      const allPdfs = await storage.getActivePdfs();
      const availableSubjects = allPdfs
        .filter(pdf => pdf.grade === grade && pdf.board === board.toUpperCase())
        .map(pdf => pdf.subject);
      
      res.json({ subjects: availableSubjects });
    } catch (error) {
      console.error("Error fetching available subjects:", error);
      res.status(500).json({ error: "Failed to fetch available subjects" });
    }
  });

  // Admin: Upload PDF
  app.post("/api/admin/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file provided" });
      }

      const filename = req.file.originalname;
      
      // Check for CPCT section format: CPCT_{section}.pdf (e.g., CPCT_MS_Office.pdf)
      const cpctSectionMatch = filename.match(/^CPCT_(.+)\.pdf$/i);
      
      // Check for Navodaya section format: {grade}_navodaya_{section}.pdf (e.g., 6th_navodaya_mental_ability_test.pdf, 9th_navodaya_mathematics.pdf)
      const navodayaSectionMatch = filename.match(/^(\d+(?:st|nd|rd|th)?|6th|9th)_navodaya_(.+)\.pdf$/i);
      
      // Check for Navodaya simple format: {grade}_navodaya.pdf (e.g., 6th_navodaya.pdf)
      const navodayaSimpleMatch = filename.match(/^(\d+(?:st|nd|rd|th)?|6th|9th)_navodaya\.pdf$/i);
      
      // Check for Chapter Practice format: {grade}_{board}_Chapter_Plan_{subject}.pdf (e.g., 8th_MP_Chapter_Plan_Mathematics.pdf)
      const chapterPracticeMatch = filename.match(/^(\d+(?:st|nd|rd|th))_([A-Za-z]+)_Chapter_Plan_(.+)\.pdf$/i);
      
      // Check for Board Exam format: {grade}_{board}_{subject}.pdf
      const boardMatch = filename.match(/^(.+)_(.+)_(.+)\.pdf$/i);
      
      // Determine which format this file matches (order matters - check specific formats first)
      const isCpct = cpctSectionMatch !== null;
      const isNavodayaSection = navodayaSectionMatch !== null;
      const isNavodayaSimple = navodayaSimpleMatch !== null;
      const isNavodaya = isNavodayaSection || isNavodayaSimple;
      const isChapterPractice = chapterPracticeMatch !== null;
      
      if (!isCpct && !isNavodaya && !isChapterPractice && !boardMatch) {
        return res.status(400).json({ 
          error: "Invalid filename format. Expected: grade_board_subject.pdf (Board Exam), grade_board_Chapter_Plan_subject.pdf (Chapter Practice), CPCT_{section}.pdf (CPCT), or grade_navodaya_{section}.pdf (Navodaya)" 
        });
      }

      // Check if active PDF already exists
      const existingActivePdf = await storage.getPdfByFilename(filename);
      if (existingActivePdf) {
        return res.status(409).json({ error: "PDF with this name already exists" });
      }

      // Extract text from PDF
      const content = await parsePdf(req.file.buffer);

      if (!content || content.trim().length < 100) {
        return res.status(400).json({ error: "PDF appears to be empty or contains too little text" });
      }

      let grade: string, board: string, subject: string;
      
      if (isCpct) {
        // CPCT format - use special values
        grade = "CPCT";
        board = "CPCT";
        subject = cpctSectionMatch![1]; // Section name from filename
      } else if (isNavodayaSection) {
        // Navodaya section format - e.g., 9th_navodaya_mathematics.pdf
        grade = navodayaSectionMatch![1];
        board = "Navodaya";
        subject = navodayaSectionMatch![2]; // Section name from filename
      } else if (isNavodayaSimple) {
        // Navodaya simple format - e.g., 6th_navodaya.pdf
        grade = navodayaSimpleMatch![1];
        board = "Navodaya";
        subject = "Navodaya Entrance";
      } else if (isChapterPractice) {
        // Chapter Practice format - e.g., 8th_MP_Chapter_Plan_Mathematics.pdf
        const [, g, b, s] = chapterPracticeMatch!;
        grade = g;
        board = b.toUpperCase(); // Store as "MP" - filename pattern identifies it as Chapter Practice
        subject = s;
      } else {
        // Board Exam format
        const [, g, b, s] = boardMatch!;
        grade = g;
        board = b.toUpperCase();
        subject = s;
      }

      // Check if there's an archived PDF with this filename - replace it instead of creating new
      const archivedPdf = await storage.getAnyPdfByFilename(filename);
      let pdf;
      
      if (archivedPdf && archivedPdf.isArchived) {
        // Replace the archived PDF with new content
        pdf = await storage.replacePdf(archivedPdf.id, content, grade, board, subject);
        console.log(`Replaced archived PDF ${filename} with new content`);
      } else {
        // Create new PDF
        pdf = await storage.createPdf({ filename, grade, board, subject, content });
      }
      
      if (!pdf) {
        return res.status(500).json({ error: "Failed to save PDF" });
      }

      // Parse questions from PDF content for sequential picking
      const parsedQuestions = parseQuestionsFromPdfContent(content);
      console.log(`Parsed ${parsedQuestions.length} questions from ${filename}`);
      
      // Store parsed questions in the PDF record
      if (parsedQuestions.length > 0) {
        await storage.updatePdfParsedQuestions(pdf.id, parsedQuestions, parsedQuestions.length);
      }

      res.json({ 
        message: "PDF uploaded successfully",
        pdf: {
          id: pdf.id,
          filename: pdf.filename,
          grade: pdf.grade,
          board: pdf.board,
          subject: pdf.subject,
          contentLength: content.length,
          totalQuestions: parsedQuestions.length,
        }
      });
    } catch (error: unknown) {
      console.error("Error uploading PDF:", error);
      const message = error instanceof Error ? error.message : "Failed to upload PDF";
      res.status(500).json({ error: message });
    }
  });

  // Get all uploaded PDFs (admin)
  app.get("/api/admin/pdfs", async (req, res) => {
    try {
      const pdfs = await storage.getAllPdfs();
      res.json(pdfs.map(pdf => ({
        id: pdf.id,
        filename: pdf.filename,
        grade: pdf.grade,
        board: pdf.board,
        subject: pdf.subject,
        uploadedAt: pdf.uploadedAt,
        isArchived: pdf.isArchived ?? false,
      })));
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      res.status(500).json({ error: "Failed to fetch PDFs" });
    }
  });

  // Get Chapter Practice PDFs (admin)
  app.get("/api/admin/chapter-practice-pdfs", async (req, res) => {
    try {
      const pdfs = await storage.getChapterPracticePdfs();
      res.json(pdfs.map(pdf => ({
        id: pdf.id,
        filename: pdf.filename,
        grade: pdf.grade,
        board: pdf.board,
        subject: pdf.subject,
        uploadedAt: pdf.uploadedAt,
        isArchived: pdf.isArchived ?? false,
      })));
    } catch (error) {
      console.error("Error fetching Chapter Practice PDFs:", error);
      res.status(500).json({ error: "Failed to fetch Chapter Practice PDFs" });
    }
  });

  // Admin: Re-parse all PDFs with updated parser logic
  app.post("/api/admin/reparse-all-pdfs", async (req, res) => {
    try {
      console.log("Starting re-parse of all PDFs...");
      const pdfs = await storage.getAllPdfs();
      const results: { id: number; filename: string; oldCount: number; newCount: number; status: string }[] = [];
      
      for (const pdf of pdfs) {
        try {
          const oldCount = pdf.totalQuestions || 0;
          const parsedQuestions = parseQuestionsFromPdfContent(pdf.content);
          await storage.updatePdfParsedQuestions(pdf.id, parsedQuestions, parsedQuestions.length);
          
          results.push({
            id: pdf.id,
            filename: pdf.filename,
            oldCount,
            newCount: parsedQuestions.length,
            status: "success"
          });
          console.log(`Re-parsed ${pdf.filename}: ${oldCount} -> ${parsedQuestions.length} questions`);
        } catch (pdfError) {
          console.error(`Error re-parsing ${pdf.filename}:`, pdfError);
          results.push({
            id: pdf.id,
            filename: pdf.filename,
            oldCount: pdf.totalQuestions || 0,
            newCount: 0,
            status: "error"
          });
        }
      }
      
      const successCount = results.filter(r => r.status === "success").length;
      console.log(`Re-parse complete: ${successCount}/${pdfs.length} PDFs processed successfully`);
      
      res.json({
        message: `Re-parsed ${successCount} of ${pdfs.length} PDFs`,
        results
      });
    } catch (error) {
      console.error("Error re-parsing PDFs:", error);
      res.status(500).json({ error: "Failed to re-parse PDFs" });
    }
  });

  // Get single PDF with content (admin preview)
  app.get("/api/admin/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PDF ID" });
      }
      const pdf = await storage.getPdf(id);
      if (!pdf) {
        return res.status(404).json({ error: "PDF not found" });
      }
      res.json({
        id: pdf.id,
        filename: pdf.filename,
        grade: pdf.grade,
        board: pdf.board,
        subject: pdf.subject,
        content: pdf.content,
        contentLength: pdf.content.length,
        uploadedAt: pdf.uploadedAt,
      });
    } catch (error) {
      console.error("Error fetching PDF:", error);
      res.status(500).json({ error: "Failed to fetch PDF" });
    }
  });

  // Archive PDF (admin) - soft delete to preserve quiz history
  app.delete("/api/admin/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PDF ID" });
      }
      const archived = await storage.deletePdf(id);
      if (!archived) {
        return res.status(404).json({ error: "PDF not found" });
      }
      res.json({ message: "PDF archived successfully. Quiz history is preserved." });
    } catch (error) {
      console.error("Error archiving PDF:", error);
      res.status(500).json({ error: "Failed to archive PDF" });
    }
  });

  // Restore archived PDF (admin)
  app.post("/api/admin/pdfs/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PDF ID" });
      }
      const restored = await storage.restorePdf(id);
      if (!restored) {
        return res.status(404).json({ error: "PDF not found" });
      }
      res.json({ message: "PDF restored successfully" });
    } catch (error) {
      console.error("Error restoring PDF:", error);
      res.status(500).json({ error: "Failed to restore PDF" });
    }
  });

  // Re-parse all PDFs to extract questions (admin - for existing PDFs uploaded before parsing feature)
  app.post("/api/admin/pdfs/reparse-all", async (req, res) => {
    try {
      const allPdfs = await storage.getAllPdfs();
      const results: { id: number; filename: string; questionsFound: number; error?: string }[] = [];
      
      for (const pdf of allPdfs) {
        try {
          // Get the full PDF with content
          const fullPdf = await storage.getPdf(pdf.id);
          if (!fullPdf || !fullPdf.content) {
            results.push({ id: pdf.id, filename: pdf.filename, questionsFound: 0, error: "No content" });
            continue;
          }
          
          const parsedQuestions = parseQuestionsFromPdfContent(fullPdf.content);
          console.log(`Re-parsed ${parsedQuestions.length} questions from ${pdf.filename}`);
          
          if (parsedQuestions.length > 0) {
            await storage.updatePdfParsedQuestions(pdf.id, parsedQuestions, parsedQuestions.length);
          }
          
          results.push({ id: pdf.id, filename: pdf.filename, questionsFound: parsedQuestions.length });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          results.push({ id: pdf.id, filename: pdf.filename, questionsFound: 0, error: errorMsg });
        }
      }
      
      res.json({ 
        message: "PDFs re-parsed successfully", 
        results,
        totalPdfs: allPdfs.length,
        successCount: results.filter(r => !r.error).length
      });
    } catch (error) {
      console.error("Error re-parsing PDFs:", error);
      res.status(500).json({ error: "Failed to re-parse PDFs" });
    }
  });

  // Generate quiz questions
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const { studentId, grade, board, subject, medium, useUnifiedAuth } = req.body;

      if (!studentId || !grade || !board || !subject) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify student exists - check unified_students if useUnifiedAuth is true
      let studentMedium = medium || "English";
      if (useUnifiedAuth) {
        const unifiedStudent = await storage.getUnifiedStudent(studentId);
        if (!unifiedStudent) {
          return res.status(404).json({ error: "Student not found" });
        }
      } else {
        const student = await storage.getStudent(studentId);
        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }
        studentMedium = medium || student.medium || "English";
      }

      // Find the PDF for this grade/board/subject
      const pdf = await storage.getPdfByGradeBoardSubject(grade, board.toUpperCase(), subject);
      
      let questions: Question[];
      
      if (pdf && pdf.parsedQuestions && Array.isArray(pdf.parsedQuestions) && pdf.parsedQuestions.length > 0) {
        // SERVER-SIDE SEQUENTIAL QUESTION PICKING
        const parsedQuestions = pdf.parsedQuestions as ParsedQuestion[];
        
        // Get current question pointer for this student + PDF
        const pointer = await storage.getQuestionPointer(studentId, 'board', pdf.id);
        const startIndex = pointer ? (pointer.lastQuestionIndex + 1) % parsedQuestions.length : 0;
        
        console.log(`Student ${studentId} - PDF ${pdf.id}: Starting from index ${startIndex} of ${parsedQuestions.length} questions`);
        
        // Request 12 questions as buffer to ensure we get at least 10 after LLM conversion
        const requestCount = Math.min(12, parsedQuestions.length);
        const { questions: selectedQuestions, newLastIndex } = getSequentialQuestions(
          parsedQuestions,
          startIndex,
          requestCount
        );
        
        // Build subset content from selected questions
        const subsetContent = selectedQuestions.map((q, i) => 
          `Question ${i + 1}:\n${q.rawText}${q.answer ? `\nAnswer: ${q.answer}` : ''}`
        ).join('\n\n---\n\n');
        
        console.log(`Sending ${selectedQuestions.length} sequential questions to LLM for conversion`);
        
        // Generate MCQs from the subset
        let generatedQuestions = await generateQuizQuestions(
          subsetContent,
          subject,
          grade,
          board,
          requestCount,
          [], // No previous questions needed - we handle sequencing server-side
          studentMedium
        );
        
        // Trim to exactly 10 questions if we got more
        questions = generatedQuestions.slice(0, 10);
        
        // Calculate pointer based on actual questions used (max 10)
        const questionsUsed = Math.min(questions.length, 10);
        const actualNewIndex = (startIndex + questionsUsed - 1) % parsedQuestions.length;
        
        // Update question pointer for next quiz
        await storage.updateQuestionPointer(studentId, 'board', pdf.id, actualNewIndex);
        console.log(`Generated ${generatedQuestions.length} questions, using ${questions.length}. Updated pointer to index ${actualNewIndex} for next quiz`);
        
      } else if (pdf) {
        // Fallback: PDF exists but no parsed questions - use full content
        console.log(`PDF ${pdf.id} has no parsed questions, using full content`);
        const previousQuestions = await storage.getStudentPreviousQuestions(studentId, subject);
        questions = await generateQuizQuestions(
          pdf.content,
          subject,
          grade,
          board,
          10,
          previousQuestions,
          studentMedium
        );
      } else {
        // Generate general questions for the subject (fallback when no PDF uploaded)
        // Provide grade-specific curriculum topics to ensure appropriate difficulty
        const gradeTopics: Record<string, Record<string, string>> = {
          "8th": {
            Mathematics: "Linear equations, quadrilaterals, data handling, squares and square roots, cubes and cube roots, comparing quantities, algebraic expressions, mensuration, exponents and powers, direct and inverse proportions.",
            Science: "Crop production, microorganisms, synthetic fibres, metals and non-metals, coal and petroleum, combustion and flame, cell structure, reproduction in animals, force and pressure, friction, sound, chemical effects of electric current, light, stars and solar system, pollution."
          },
          "10th": {
            Mathematics: "Real numbers, polynomials, pair of linear equations, quadratic equations, arithmetic progressions, triangles, coordinate geometry, trigonometry, circles, areas related to circles, surface areas and volumes, statistics, probability.",
            Science: "Chemical reactions, acids bases and salts, metals and non-metals, carbon compounds, periodic classification, life processes, control and coordination, reproduction, heredity and evolution, light reflection refraction, human eye, electricity, magnetic effects, sources of energy, environment, natural resources."
          },
          "12th": {
            Mathematics: "Relations and functions, inverse trigonometric functions, matrices, determinants, continuity and differentiability, applications of derivatives, integrals, applications of integrals, differential equations, vectors, three-dimensional geometry, linear programming, probability.",
            Science: "Solid state, solutions, electrochemistry, chemical kinetics, surface chemistry, p-block elements, d and f block elements, coordination compounds, haloalkanes, alcohols phenols ethers, aldehydes ketones, amines, biomolecules, polymers, chemistry in everyday life.",
            Physics: "Electric charges and fields, electrostatic potential, current electricity, moving charges and magnetism, magnetism and matter, electromagnetic induction, alternating current, electromagnetic waves, ray optics, wave optics, dual nature of radiation, atoms, nuclei, semiconductor electronics."
          }
        };
        
        // Extract base grade number
        const baseGrade = grade.replace(/(st|nd|rd|th)$/i, '').trim() + "th";
        const topicsForGrade = gradeTopics[baseGrade] || {};
        const subjectTopics = topicsForGrade[subject] || `Advanced ${subject} topics appropriate for ${grade} grade level in Indian education system.`;
        
        const fallbackContent = `${subject} curriculum for ${grade} grade students in ${board} board, India.

GRADE-SPECIFIC TOPICS (${grade} grade level ONLY - do NOT include topics from lower grades):
${subjectTopics}

IMPORTANT: Generate questions ONLY at ${grade} grade difficulty level. Do NOT use concepts from lower grades like 8th or 10th for 12th grade questions.`;
        
        // Get previous questions for fallback case (no PDF)
        const fallbackPreviousQuestions = await storage.getStudentPreviousQuestions(studentId, subject);
        
        questions = await generateQuizQuestions(
          fallbackContent,
          subject,
          grade,
          board,
          10,
          fallbackPreviousQuestions,
          studentMedium
        );
      }

      // Create quiz session
      const session = await storage.createQuizSession({
        studentId,
        pdfId: pdf?.id || null,
        subject,
        grade,
        board: board.toUpperCase(),
        questions,
        totalQuestions: questions.length, // Use actual count of generated questions
      });

      res.json({
        sessionId: session.id,
        questions,
      });
    } catch (error: unknown) {
      console.error("Error generating quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to generate quiz";
      res.status(500).json({ error: message });
    }
  });

  // Get AI feedback for an answer
  app.post("/api/quiz/feedback", async (req, res) => {
    try {
      const { question, selectedOption, correctOption, isCorrect } = req.body;

      if (question === undefined || selectedOption === undefined || correctOption === undefined || isCorrect === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const feedback = await generateAnswerFeedback(
        question,
        selectedOption,
        correctOption,
        isCorrect
      );

      res.json({ feedback });
    } catch (error: unknown) {
      console.error("Error generating feedback:", error);
      res.status(500).json({ feedback: "Keep practicing!" });
    }
  });

  // Submit quiz results
  app.post("/api/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, score } = req.body;

      if (!sessionId || answers === undefined || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await storage.updateQuizSession(sessionId, {
        answers,
        score,
        completedAt: new Date(),
      });

      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }

      res.json({
        message: "Quiz completed",
        score,
        totalQuestions: session.totalQuestions,
      });
    } catch (error: unknown) {
      console.error("Error submitting quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to submit quiz";
      res.status(500).json({ error: message });
    }
  });

  // Get student's quiz history
  app.get("/api/students/:studentId/quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getStudentQuizSessions(studentId);
      
      res.json(sessions.map(s => ({
        id: s.id,
        subject: s.subject,
        grade: s.grade,
        board: s.board,
        score: s.score,
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt,
      })));
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Get detailed quiz session for review (includes questions and answers)
  app.get("/api/quiz/:sessionId/review", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }
      
      res.json({
        id: session.id,
        subject: session.subject,
        grade: session.grade,
        board: session.board,
        score: session.score,
        totalQuestions: session.totalQuestions,
        questions: session.questions,
        answers: session.answers,
        completedAt: session.completedAt,
      });
    } catch (error) {
      console.error("Error fetching quiz for review:", error);
      res.status(500).json({ error: "Failed to fetch quiz details" });
    }
  });

  // Admin: Get all students with their progress
  app.get("/api/admin/students", async (req, res) => {
    try {
      const allStudents = await storage.getAllStudents();
      
      // Get quiz data for each student
      const studentsWithProgress = await Promise.all(
        allStudents.map(async (student) => {
          const sessions = await storage.getStudentQuizSessions(student.id);
          const completedSessions = sessions.filter(s => s.completedAt);
          const totalQuizzes = completedSessions.length;
          const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.totalQuestions || 10), 0);
          const averageScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
          
          // Get subjects attempted
          const subjectsAttempted = Array.from(new Set(completedSessions.map(s => s.subject)));
          
          return {
            id: student.id,
            name: student.name,
            grade: student.grade,
            board: student.board,
            location: student.location,
            mobileNumber: student.mobileNumber,
            totalQuizzes,
            averageScore,
            subjectsAttempted,
            sessions: completedSessions.map(s => ({
              id: s.id,
              subject: s.subject,
              score: s.score,
              totalQuestions: s.totalQuestions,
              completedAt: s.completedAt,
            })),
          };
        })
      );
      
      res.json(studentsWithProgress);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Admin: Download student progress as CSV
  app.get("/api/admin/students/csv", async (req, res) => {
    try {
      const { studentIds } = req.query;
      
      const allStudents = await storage.getAllStudents();
      
      // Filter by student IDs if provided
      let filteredStudents = allStudents;
      if (studentIds && typeof studentIds === "string") {
        const ids = studentIds.split(",").map(id => parseInt(id.trim()));
        filteredStudents = allStudents.filter(s => ids.includes(s.id));
      }
      
      // Build CSV data
      const csvRows: string[] = [];
      csvRows.push("Student Name,Grade,Board,Location,Mobile,Subject,Quiz Date,Score,Total Questions,Percentage");
      
      for (const student of filteredStudents) {
        const sessions = await storage.getStudentQuizSessions(student.id);
        const completedSessions = sessions.filter(s => s.completedAt);
        
        if (completedSessions.length === 0) {
          // Include student even if no quizzes taken
          csvRows.push(
            `"${student.name}","${student.grade}","${student.board}","${student.location}","${student.mobileNumber}","No quizzes taken","","","",""`
          );
        } else {
          for (const session of completedSessions) {
            const percentage = session.totalQuestions 
              ? Math.round(((session.score || 0) / session.totalQuestions) * 100)
              : 0;
            const dateStr = session.completedAt 
              ? new Date(session.completedAt).toLocaleDateString("en-IN")
              : "";
            csvRows.push(
              `"${student.name}","${student.grade}","${student.board}","${student.location}","${student.mobileNumber}","${session.subject}","${dateStr}","${session.score || 0}","${session.totalQuestions}","${percentage}%"`
            );
          }
        }
      }
      
      const csv = csvRows.join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="student_progress_${new Date().toISOString().split("T")[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error generating CSV:", error);
      res.status(500).json({ error: "Failed to generate CSV" });
    }
  });

  // Admin: Update board exam student
  const VALID_GRADES = ["8th", "10th"];
  const VALID_BOARDS = ["MP", "CBSE"];
  const VALID_MEDIUMS = ["Hindi", "English"];
  
  app.patch("/api/admin/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const { name, grade, board, medium, location, mobileNumber } = req.body;
      
      if (grade !== undefined && !VALID_GRADES.includes(grade)) {
        return res.status(400).json({ error: `Invalid grade. Must be one of: ${VALID_GRADES.join(", ")}` });
      }
      if (board !== undefined && !VALID_BOARDS.includes(board)) {
        return res.status(400).json({ error: `Invalid board. Must be one of: ${VALID_BOARDS.join(", ")}` });
      }
      if (medium !== undefined && !VALID_MEDIUMS.includes(medium)) {
        return res.status(400).json({ error: `Invalid medium. Must be one of: ${VALID_MEDIUMS.join(", ")}` });
      }
      
      const updates: any = {};
      if (name !== undefined && typeof name === "string" && name.trim()) updates.name = name.trim();
      if (grade !== undefined) updates.grade = grade;
      if (board !== undefined) updates.board = board;
      if (medium !== undefined) updates.medium = medium;
      if (location !== undefined && typeof location === "string") updates.location = location.trim();
      if (mobileNumber !== undefined && typeof mobileNumber === "string") updates.mobileNumber = mobileNumber.trim();
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const student = await storage.updateStudent(id, updates);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  // Admin: Delete board exam student
  app.delete("/api/admin/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Admin: Update CPCT student
  app.patch("/api/admin/cpct-students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const { name, medium, location, mobileNumber } = req.body;
      
      if (medium !== undefined && !VALID_MEDIUMS.includes(medium)) {
        return res.status(400).json({ error: `Invalid medium. Must be one of: ${VALID_MEDIUMS.join(", ")}` });
      }
      
      const updates: any = {};
      if (name !== undefined && typeof name === "string" && name.trim()) updates.name = name.trim();
      if (medium !== undefined) updates.medium = medium;
      if (location !== undefined && typeof location === "string") updates.location = location.trim();
      if (mobileNumber !== undefined && typeof mobileNumber === "string") updates.mobileNumber = mobileNumber.trim();
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const student = await storage.updateCpctStudent(id, updates);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating CPCT student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  // Admin: Delete CPCT student
  app.delete("/api/admin/cpct-students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      const success = await storage.deleteCpctStudent(id);
      if (!success) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CPCT student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Admin: Update Navodaya student
  const VALID_NAVODAYA_GRADES = ["6th", "9th"];
  
  app.patch("/api/admin/navodaya-students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const { name, examGrade, medium, location, mobileNumber } = req.body;
      
      if (examGrade !== undefined && !VALID_NAVODAYA_GRADES.includes(examGrade)) {
        return res.status(400).json({ error: `Invalid exam grade. Must be one of: ${VALID_NAVODAYA_GRADES.join(", ")}` });
      }
      if (medium !== undefined && !VALID_MEDIUMS.includes(medium)) {
        return res.status(400).json({ error: `Invalid medium. Must be one of: ${VALID_MEDIUMS.join(", ")}` });
      }
      
      const updates: any = {};
      if (name !== undefined && typeof name === "string" && name.trim()) updates.name = name.trim();
      if (examGrade !== undefined) updates.examGrade = examGrade;
      if (medium !== undefined) updates.medium = medium;
      if (location !== undefined && typeof location === "string") updates.location = location.trim();
      if (mobileNumber !== undefined && typeof mobileNumber === "string") updates.mobileNumber = mobileNumber.trim();
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const student = await storage.updateNavodayaStudent(id, updates);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating Navodaya student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  // Admin: Delete Navodaya student
  app.delete("/api/admin/navodaya-students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      const success = await storage.deleteNavodayaStudent(id);
      if (!success) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting Navodaya student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // ============================================
  // CPCT EXAM PREP ROUTES
  // ============================================

  // CPCT Student registration
  app.post("/api/cpct/students/register", async (req, res) => {
    try {
      const validatedData = insertCpctStudentSchema.parse(req.body);
      
      // Check if student already exists by mobile number
      const existingStudent = await storage.getCpctStudentByMobile(validatedData.mobileNumber);
      if (existingStudent) {
        return res.json(existingStudent);
      }
      
      const student = await storage.createCpctStudent(validatedData);
      res.json(student);
    } catch (error: unknown) {
      console.error("Error registering CPCT student:", error);
      const message = error instanceof Error ? error.message : "Failed to register student";
      res.status(400).json({ error: message });
    }
  });

  // CPCT Student login
  app.post("/api/cpct/students/login", async (req, res) => {
    try {
      const { name, mobileNumber } = req.body;
      
      if (!name || !mobileNumber) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }
      
      const student = await storage.getCpctStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      // Verify name matches (case-insensitive, trimmed)
      if (student.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error logging in CPCT student:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get CPCT student by ID
  app.get("/api/cpct/students/:id", async (req, res) => {
    try {
      const student = await storage.getCpctStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching CPCT student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // CPCT Section constants
  const CPCT_SECTIONS = [
    "MS Office",
    "Software Operating System & IT Fundamentals",
    "Internet, Networking & Security",
    "Hardware Peripheral & Devices",
    "Aptitude & Logical Reasoning",
  ];

  // Helper function to normalize text for fuzzy matching
  const normalizeForMatch = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric chars
      .replace(/\s+/g, '');
  };

  // Helper function to find matching PDF for a section using fuzzy matching
  const findPdfForSection = (pdfs: Array<{id: number, filename: string, content: string, parsedQuestions: unknown, totalQuestions: number | null}>, section: string) => {
    const normalizedSection = normalizeForMatch(section);
    
    // Find CPCT PDFs that match the section name (fuzzy match)
    const cpctPdfs = pdfs.filter(pdf => {
      if (!pdf.filename.startsWith("CPCT_") || !pdf.filename.endsWith(".pdf")) return false;
      
      // Extract section name from filename (e.g., CPCT_MS_OFFICE.pdf -> ms_office)
      const filenamePart = pdf.filename
        .replace(/^CPCT_/, '')
        .replace(/\.pdf$/i, '');
      const normalizedFilename = normalizeForMatch(filenamePart);
      
      // Check if the filename contains the key parts of the section name
      return normalizedFilename.includes(normalizedSection) || 
             normalizedSection.includes(normalizedFilename) ||
             // Handle specific mappings
             (section === "MS Office" && normalizedFilename.includes("msoffice")) ||
             (section === "MS Office" && normalizedFilename.includes("office")) ||
             (section === "Software Operating System & IT Fundamentals" && (normalizedFilename.includes("software") || normalizedFilename.includes("operating") || normalizedFilename.includes("itfundamentals"))) ||
             (section === "Internet, Networking & Security" && (normalizedFilename.includes("internet") || normalizedFilename.includes("networking") || normalizedFilename.includes("security"))) ||
             (section === "Hardware Peripheral & Devices" && (normalizedFilename.includes("hardware") || normalizedFilename.includes("peripheral") || normalizedFilename.includes("devices"))) ||
             (section === "Aptitude & Logical Reasoning" && (normalizedFilename.includes("aptitude") || normalizedFilename.includes("logical") || normalizedFilename.includes("reasoning")));
    });
    
    return cpctPdfs.length > 0 ? cpctPdfs[0] : null;
  };

  // Get available CPCT sections (based on uploaded PDFs)
  app.get("/api/cpct/available-sections", async (req, res) => {
    try {
      const allPdfs = await storage.getActivePdfs();
      const cpctPdfs = allPdfs.filter(pdf => 
        pdf.filename.startsWith("CPCT_") && pdf.filename.endsWith(".pdf")
      );
      
      // Map uploaded PDFs to their corresponding sections - only return sections with actual PDFs
      const availableSections = CPCT_SECTIONS.filter(section => {
        const matchingPdf = findPdfForSection(cpctPdfs, section);
        return matchingPdf !== null;
      });
      
      res.json({ sections: availableSections });
    } catch (error) {
      console.error("Error fetching available CPCT sections:", error);
      res.status(500).json({ error: "Failed to fetch available sections" });
    }
  });

  // Get available CPCT years (PDFs named CPCT_Year.pdf) - kept for backward compatibility
  app.get("/api/cpct/available-years", async (req, res) => {
    try {
      const allPdfs = await storage.getActivePdfs();
      const cpctYears = allPdfs
        .filter(pdf => pdf.filename.startsWith("CPCT_") && pdf.filename.endsWith(".pdf"))
        .map(pdf => {
          const match = pdf.filename.match(/CPCT_(\d+)\.pdf/);
          return match ? match[1] : null;
        })
        .filter((year): year is string => year !== null);
      
      res.json({ years: cpctYears });
    } catch (error) {
      console.error("Error fetching available CPCT years:", error);
      res.status(500).json({ error: "Failed to fetch available years" });
    }
  });

  // Generate CPCT quiz questions
  app.post("/api/cpct/quiz/generate", async (req, res) => {
    try {
      const { studentId, section } = req.body;

      if (!studentId || !section) {
        return res.status(400).json({ error: "Missing required fields: studentId and section are required" });
      }

      // Validate section is one of the allowed sections
      if (!CPCT_SECTIONS.includes(section)) {
        return res.status(400).json({ error: "Invalid section. Please select a valid CPCT section." });
      }

      // Verify CPCT student exists
      const student = await storage.getCpctStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get all available CPCT PDFs (only active, not archived)
      const allPdfs = await storage.getActivePdfs();
      
      // Find PDF matching the selected section using fuzzy matching
      const matchingPdf = findPdfForSection(allPdfs, section);
      
      let usedYear = "2024"; // Default year for reference
      let usedPdfId: number | null = null;
      let questions: Question[];
      const medium = student.medium as "Hindi" | "English";
      
      console.log(`CPCT Quiz generation - Section: ${section}, Student: ${studentId}`);
      
      if (matchingPdf) {
        console.log(`Found matching PDF: ${matchingPdf.filename} for section: ${section}`);
        usedPdfId = matchingPdf.id;
        
        // Check if PDF has parsed questions for sequential picking
        if (matchingPdf.parsedQuestions && Array.isArray(matchingPdf.parsedQuestions) && matchingPdf.parsedQuestions.length > 0) {
          // SERVER-SIDE SEQUENTIAL QUESTION PICKING
          const parsedQuestions = matchingPdf.parsedQuestions as ParsedQuestion[];
          
          // Get current question pointer for this student + PDF
          const pointer = await storage.getQuestionPointer(studentId, 'cpct', matchingPdf.id);
          const startIndex = pointer ? (pointer.lastQuestionIndex + 1) % parsedQuestions.length : 0;
          
          console.log(`CPCT Student ${studentId} - PDF ${matchingPdf.id} (${section}): Starting from index ${startIndex} of ${parsedQuestions.length} questions`);
          
          // Request 12 questions as buffer to ensure we get at least 10 after LLM conversion
          const requestCount = Math.min(12, parsedQuestions.length);
          const { questions: selectedQuestions, newLastIndex } = getSequentialQuestions(
            parsedQuestions,
            startIndex,
            requestCount
          );
          
          // Build subset content from selected questions
          const subsetContent = selectedQuestions.map((q, i) => 
            `Question ${i + 1}:\n${q.rawText}${q.answer ? `\nAnswer: ${q.answer}` : ''}`
          ).join('\n\n---\n\n');
          
          console.log(`Sending ${selectedQuestions.length} sequential CPCT questions to LLM for conversion`);
          
          // Generate MCQs from the subset
          let generatedQuestions = await generateCpctQuizQuestions(
            subsetContent,
            usedYear,
            medium,
            requestCount,
            [] // No previous questions needed - we handle sequencing server-side
          );
          
          // Trim to exactly 10 questions if we got more
          questions = generatedQuestions.slice(0, 10);
          
          // Calculate pointer based on actual questions used (max 10)
          const questionsUsed = Math.min(questions.length, 10);
          const actualNewIndex = (startIndex + questionsUsed - 1) % parsedQuestions.length;
          
          // Update question pointer for next quiz
          await storage.updateQuestionPointer(studentId, 'cpct', matchingPdf.id, actualNewIndex);
          console.log(`Generated ${generatedQuestions.length} questions, using ${questions.length}. Updated CPCT pointer to index ${actualNewIndex} for next quiz`);
        } else {
          // Fallback: PDF exists but no parsed questions - use full content
          console.log(`CPCT PDF ${matchingPdf.id} has no parsed questions, using full content`);
          const previousQuestions = await storage.getCpctStudentPreviousQuestions(studentId);
          questions = await generateCpctQuizQuestions(
            matchingPdf.content,
            usedYear,
            medium,
            10,
            previousQuestions
          );
        }
      } else {
        // Generate section-specific CPCT questions (fallback when no matching PDF uploaded)
        console.log(`No matching PDF found for section: ${section}, using fallback questions`);
        const previousQuestions = await storage.getCpctStudentPreviousQuestions(studentId);
        
        // Section-specific curriculum descriptions
        const sectionCurriculum: Record<string, string> = {
          "MS Office": "CPCT exam questions on MS Office including Microsoft Word (formatting, tables, mail merge), Microsoft Excel (formulas, functions, charts, pivot tables), Microsoft PowerPoint (presentations, animations, transitions), and basic office productivity concepts.",
          "Software Operating System & IT Fundamentals": "CPCT exam questions on Operating Systems (Windows fundamentals, file management, system settings), Computer Basics (hardware vs software, types of software), IT Fundamentals (number systems, storage units, basic troubleshooting).",
          "Internet, Networking & Security": "CPCT exam questions on Internet concepts (browsers, email, web protocols), Networking basics (LAN, WAN, TCP/IP, network devices), Cyber Security (viruses, malware, safe browsing, passwords, firewalls).",
          "Hardware Peripheral & Devices": "CPCT exam questions on Computer Hardware (CPU, RAM, motherboard, storage devices), Input/Output Devices (keyboard, mouse, printer, scanner, monitor), and peripheral connectivity.",
          "Aptitude & Logical Reasoning": "CPCT exam questions on Numerical Aptitude (arithmetic, percentages, ratios), Logical Reasoning (series, patterns, coding-decoding, analogies), and Basic Mathematics.",
        };
        
        const curriculum = sectionCurriculum[section] || `CPCT exam questions on ${section} for computer proficiency certification in Madhya Pradesh, India.`;
        
        questions = await generateCpctQuizQuestions(
          curriculum,
          usedYear,
          medium,
          10,
          previousQuestions
        );
      }

      // Create CPCT quiz session
      const session = await storage.createCpctQuizSession({
        studentId,
        pdfId: usedPdfId,
        year: usedYear,
        section: section,
        medium: student.medium,
        questions,
        totalQuestions: questions.length, // Use actual count of generated questions
      });

      res.json({
        sessionId: session.id,
        questions,
      });
    } catch (error: unknown) {
      console.error("Error generating CPCT quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to generate quiz";
      res.status(500).json({ error: message });
    }
  });

  // Submit CPCT quiz results
  app.post("/api/cpct/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, score } = req.body;

      if (!sessionId || answers === undefined || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await storage.updateCpctQuizSession(sessionId, {
        answers,
        score,
        completedAt: new Date(),
      });

      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }

      res.json({
        message: "Quiz completed",
        score,
        totalQuestions: session.totalQuestions,
      });
    } catch (error: unknown) {
      console.error("Error submitting CPCT quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to submit quiz";
      res.status(500).json({ error: message });
    }
  });

  // Get CPCT student's quiz history
  app.get("/api/cpct/students/:studentId/quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getCpctStudentQuizSessions(studentId);
      
      res.json(sessions.map(s => ({
        id: s.id,
        year: s.year,
        medium: s.medium,
        score: s.score,
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt,
      })));
    } catch (error) {
      console.error("Error fetching CPCT quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Get detailed CPCT quiz session for review
  app.get("/api/cpct/quiz/:sessionId/review", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getCpctQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }
      
      res.json({
        id: session.id,
        year: session.year,
        medium: session.medium,
        score: session.score,
        totalQuestions: session.totalQuestions,
        questions: session.questions,
        answers: session.answers,
        completedAt: session.completedAt,
      });
    } catch (error) {
      console.error("Error fetching CPCT quiz for review:", error);
      res.status(500).json({ error: "Failed to fetch quiz details" });
    }
  });

  // Admin: Get all CPCT students with their progress
  app.get("/api/admin/cpct-students", async (req, res) => {
    try {
      const allStudents = await storage.getAllCpctStudents();
      
      const studentsWithProgress = await Promise.all(
        allStudents.map(async (student) => {
          const sessions = await storage.getCpctStudentQuizSessions(student.id);
          const completedSessions = sessions.filter(s => s.completedAt);
          const totalQuizzes = completedSessions.length;
          const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.totalQuestions || 10), 0);
          const averageScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
          
          return {
            id: student.id,
            name: student.name,
            medium: student.medium,
            location: student.location,
            mobileNumber: student.mobileNumber,
            totalQuizzes,
            averageScore,
            sessions: completedSessions.map(s => ({
              id: s.id,
              year: s.year,
              score: s.score,
              totalQuestions: s.totalQuestions,
              completedAt: s.completedAt,
            })),
          };
        })
      );
      
      res.json(studentsWithProgress);
    } catch (error) {
      console.error("Error fetching CPCT students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Contact form submission
  app.post("/api/contact-submissions", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      res.json(submission);
    } catch (error: unknown) {
      console.error("Error creating contact submission:", error);
      const message = error instanceof Error ? error.message : "Failed to submit contact form";
      res.status(400).json({ error: message });
    }
  });

  // Admin: Get all contact submissions
  app.get("/api/admin/contact-submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ error: "Failed to fetch contact submissions" });
    }
  });

  // Track website visit
  app.post("/api/analytics/visit", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      // Get IP address from request headers or connection
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
        || req.socket?.remoteAddress 
        || 'unknown';
      const stats = await storage.incrementVisitorCount(today, ipAddress);
      res.json({ success: true, date: today, count: stats.totalVisitors });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.status(500).json({ error: "Failed to track visit" });
    }
  });

  // Admin: Get visitor stats
  app.get("/api/admin/analytics/visitors", async (req, res) => {
    try {
      const stats = await storage.getVisitorStats();
      const totalVisitors = await storage.getTotalVisitors();
      const totalUniqueVisitors = await storage.getTotalUniqueVisitors();
      
      // Get today's visitors
      const today = new Date().toISOString().split('T')[0];
      const todayStats = stats.find(s => s.date === today);
      const todayVisitors = todayStats?.totalVisitors || 0;
      const todayUniqueVisitors = todayStats?.uniqueVisitors || 0;
      
      res.json({
        totalVisitors,
        totalUniqueVisitors,
        todayVisitors,
        todayUniqueVisitors,
        dailyStats: stats.slice(0, 30), // Last 30 days
      });
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
      res.status(500).json({ error: "Failed to fetch visitor stats" });
    }
  });

  // ============================================
  // NOTICES ROUTES
  // ============================================

  // Public: Get active notices for landing page
  app.get("/api/notices", async (req, res) => {
    try {
      const notices = await storage.getActiveNotices();
      res.json(notices);
    } catch (error) {
      console.error("Error fetching active notices:", error);
      res.status(500).json({ error: "Failed to fetch notices" });
    }
  });

  // Admin: Get all notices
  app.get("/api/admin/notices", async (req, res) => {
    try {
      const notices = await storage.getAllNotices();
      res.json(notices);
    } catch (error) {
      console.error("Error fetching all notices:", error);
      res.status(500).json({ error: "Failed to fetch notices" });
    }
  });

  // Admin: Create notice
  app.post("/api/admin/notices", async (req, res) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.json(notice);
    } catch (error: unknown) {
      console.error("Error creating notice:", error);
      const message = error instanceof Error ? error.message : "Failed to create notice";
      res.status(400).json({ error: message });
    }
  });

  // Admin: Update notice
  app.patch("/api/admin/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.updateNotice(id, req.body);
      if (!notice) {
        return res.status(404).json({ error: "Notice not found" });
      }
      res.json(notice);
    } catch (error: unknown) {
      console.error("Error updating notice:", error);
      const message = error instanceof Error ? error.message : "Failed to update notice";
      res.status(400).json({ error: message });
    }
  });

  // Admin: Delete notice
  app.delete("/api/admin/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotice(id);
      if (!success) {
        return res.status(404).json({ error: "Notice not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ error: "Failed to delete notice" });
    }
  });

  // ============================================
  // NAVODAYA EXAM PREP ROUTES
  // ============================================

  // Navodaya Student registration
  app.post("/api/navodaya/students/register", async (req, res) => {
    try {
      const validatedData = insertNavodayaStudentSchema.parse(req.body);
      
      // Check if student already exists by mobile number
      const existingStudent = await storage.getNavodayaStudentByMobile(validatedData.mobileNumber);
      if (existingStudent) {
        return res.json(existingStudent);
      }
      
      const student = await storage.createNavodayaStudent(validatedData);
      res.json(student);
    } catch (error: unknown) {
      console.error("Error registering Navodaya student:", error);
      const message = error instanceof Error ? error.message : "Failed to register student";
      res.status(400).json({ error: message });
    }
  });

  // Navodaya Student login
  app.post("/api/navodaya/students/login", async (req, res) => {
    try {
      const { name, mobileNumber } = req.body;
      
      if (!name || !mobileNumber) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }
      
      const student = await storage.getNavodayaStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      // Verify name matches (case-insensitive, trimmed)
      if (student.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error logging in Navodaya student:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Helper function to find Navodaya PDF for a section
  const findNavodayaPdfForSection = (
    pdfs: { id: number; filename: string; content: string; parsedQuestions?: unknown; totalQuestions?: number | null }[],
    grade: string,
    section: string
  ): { id: number; filename: string; content: string; parsedQuestions?: unknown; totalQuestions?: number | null } | null => {
    const normalizeForMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedSection = normalizeForMatch(section);
    const normalizedGrade = grade.replace(/th$/, ''); // "6th" -> "6", "9th" -> "9"
    
    // Find PDFs matching the grade and section
    // Expected format: {grade}_navodaya_{section}.pdf (e.g., 6th_navodaya_mental_ability_test.pdf)
    const matchingPdfs = pdfs.filter(pdf => {
      const filename = pdf.filename.toLowerCase();
      
      // Check if it starts with the grade (e.g., 6th_, 6_, 9th_, 9_)
      if (!filename.startsWith(`${normalizedGrade}th_navodaya_`) && 
          !filename.startsWith(`${normalizedGrade}_navodaya_`)) {
        return false;
      }
      
      // Extract section part from filename
      const parts = filename.replace(/\.pdf$/i, '').split('_navodaya_');
      if (parts.length < 2) return false;
      
      const fileSection = normalizeForMatch(parts[1]);
      
      // Check for various matching strategies
      return fileSection.includes(normalizedSection) || 
             normalizedSection.includes(fileSection) ||
             // Specific mappings for 6th grade
             (section === "Mental Ability Test" && (fileSection.includes("mental") || fileSection.includes("ability"))) ||
             (section === "Arithmetic Test" && (fileSection.includes("arithmetic") || fileSection.includes("arithmatic") || fileSection.includes("math"))) ||
             (section === "Language Test" && (fileSection.includes("language") || fileSection.includes("lang"))) ||
             // Specific mappings for 9th grade
             (section === "Mathematics" && (fileSection.includes("math") || fileSection.includes("mathematics"))) ||
             (section === "Science" && fileSection.includes("science")) ||
             (section === "English" && fileSection.includes("english")) ||
             (section === "Hindi" && fileSection.includes("hindi"));
    });
    
    return matchingPdfs.length > 0 ? matchingPdfs[0] : null;
  };

  // Get available Navodaya sections (based on grade and uploaded PDFs)
  app.get("/api/navodaya/available-sections", async (req, res) => {
    try {
      const { grade } = req.query;
      
      if (!grade || (grade !== "6th" && grade !== "9th")) {
        return res.status(400).json({ error: "Valid grade (6th or 9th) is required" });
      }
      
      const allSections = grade === "6th" 
        ? [...NAVODAYA_SECTIONS_6TH] 
        : [...NAVODAYA_SECTIONS_9TH];
      
      const allPdfs = await storage.getActivePdfs();
      const navodayaPdfs = allPdfs.filter(pdf => 
        pdf.filename.toLowerCase().includes('navodaya') && 
        pdf.filename.endsWith(".pdf")
      );
      
      // Map uploaded PDFs to their corresponding sections - only return sections with actual PDFs
      const availableSections = allSections.filter(section => {
        const matchingPdf = findNavodayaPdfForSection(navodayaPdfs, grade as string, section);
        return matchingPdf !== null;
      });
      
      res.json({ sections: availableSections, grade });
    } catch (error) {
      console.error("Error fetching available Navodaya sections:", error);
      res.status(500).json({ error: "Failed to fetch available sections" });
    }
  });

  // Generate Navodaya quiz questions
  app.post("/api/navodaya/quiz/generate", async (req, res) => {
    try {
      const { studentId, section } = req.body;

      if (!studentId || !section) {
        return res.status(400).json({ error: "Missing required fields: studentId and section are required" });
      }

      // Verify student exists
      const student = await storage.getNavodayaStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Validate section based on grade
      const validSections: readonly string[] = student.examGrade === "6th" 
        ? NAVODAYA_SECTIONS_6TH 
        : NAVODAYA_SECTIONS_9TH;
      
      if (!validSections.includes(section)) {
        return res.status(400).json({ 
          error: `Invalid section for ${student.examGrade} grade. Valid sections: ${validSections.join(", ")}` 
        });
      }

      // Get PDF for the section (try section-specific PDF first)
      const allPdfs = await storage.getActivePdfs();
      const navodayaPdfs = allPdfs.filter(p => 
        p.filename.toLowerCase().includes('navodaya') && 
        p.filename.endsWith(".pdf")
      );
      
      // Try to find section-specific PDF
      let pdf = findNavodayaPdfForSection(navodayaPdfs, student.examGrade, section);
      
      // Fallback to general grade PDF if no section-specific PDF
      if (!pdf) {
        pdf = await storage.getNavodayaPdf(student.examGrade);
      }
      
      console.log(`Looking for PDF for examGrade: ${student.examGrade}, section: ${section}, Found: ${pdf ? pdf.filename : 'NO PDF FOUND'}`);
      if (pdf) {
        console.log(`PDF content length: ${pdf.content.length}, First 200 chars: ${pdf.content.substring(0, 200)}`);
      }
      
      let questions: Question[];
      const medium = student.medium as "Hindi" | "English";
      const examGrade = student.examGrade as "6th" | "9th";
      
      if (pdf && pdf.parsedQuestions && Array.isArray(pdf.parsedQuestions) && pdf.parsedQuestions.length > 0) {
        // SERVER-SIDE SEQUENTIAL QUESTION PICKING
        const parsedQuestions = pdf.parsedQuestions as ParsedQuestion[];
        
        // Get current question pointer for this student + PDF
        const pointer = await storage.getQuestionPointer(studentId, 'navodaya', pdf.id);
        const startIndex = pointer ? (pointer.lastQuestionIndex + 1) % parsedQuestions.length : 0;
        
        console.log(`Navodaya Student ${studentId} - PDF ${pdf.id}: Starting from index ${startIndex} of ${parsedQuestions.length} questions`);
        
        // Request 12 questions as buffer to ensure we get at least 10 after LLM conversion
        const requestCount = Math.min(12, parsedQuestions.length);
        const { questions: selectedQuestions, newLastIndex } = getSequentialQuestions(
          parsedQuestions,
          startIndex,
          requestCount
        );
        
        // Build subset content from selected questions
        const subsetContent = selectedQuestions.map((q, i) => 
          `Question ${i + 1}:\n${q.rawText}${q.answer ? `\nAnswer: ${q.answer}` : ''}`
        ).join('\n\n---\n\n');
        
        console.log(`Sending ${selectedQuestions.length} sequential Navodaya questions to LLM for conversion`);
        
        // Generate MCQs from the subset
        let generatedQuestions = await generateNavodayaQuizQuestions(
          subsetContent,
          examGrade,
          medium,
          requestCount,
          [] // No previous questions needed - we handle sequencing server-side
        );
        
        // Trim to exactly 10 questions if we got more
        questions = generatedQuestions.slice(0, 10);
        
        // Calculate pointer based on actual questions used (max 10)
        const questionsUsed = Math.min(questions.length, 10);
        const actualNewIndex = (startIndex + questionsUsed - 1) % parsedQuestions.length;
        
        // Update question pointer for next quiz
        await storage.updateQuestionPointer(studentId, 'navodaya', pdf.id, actualNewIndex);
        console.log(`Generated ${generatedQuestions.length} Navodaya questions, using ${questions.length}. Updated pointer to index ${actualNewIndex} for next quiz`);
        
      } else if (pdf) {
        // Fallback: PDF exists but no parsed questions - use full content
        console.log(`Navodaya PDF ${pdf.id} has no parsed questions, using full content`);
        const previousQuestions = await storage.getNavodayaStudentPreviousQuestions(studentId);
        questions = await generateNavodayaQuizQuestions(
          pdf.content,
          examGrade,
          medium,
          10,
          previousQuestions
        );
      } else {
        // Generate section-specific Navodaya questions (fallback when no PDF uploaded)
        let fallbackContent: string;
        
        if (examGrade === "6th") {
          switch (section) {
            case "Mental Ability Test":
              fallbackContent = `Navodaya Class 6 Mental Ability Test. Topics: Patterns and sequences, coding-decoding, analogies, mirror images, classifications, odd one out, figure completion, paper folding, water images, embedded figures.`;
              break;
            case "Arithmetic Test":
              fallbackContent = `Navodaya Class 6 Arithmetic Test. Topics: Basic operations, fractions, decimals, percentages, time and distance, profit and loss, ratio and proportion, simple interest, unitary method, number systems.`;
              break;
            case "Language Test":
              fallbackContent = `Navodaya Class 6 Language Test. Topics: Reading comprehension passages, grammar basics, vocabulary, sentence completion, antonyms and synonyms, word meanings, paragraph writing.`;
              break;
            default:
              fallbackContent = `Navodaya Class 6 entrance exam curriculum focusing on ${section}.`;
          }
        } else {
          switch (section) {
            case "Mathematics":
              fallbackContent = `Navodaya Class 9 Mathematics. Topics: Algebra basics, linear equations, geometry, mensuration, statistics, number system, polynomials, triangles, circles, coordinate geometry.`;
              break;
            case "Science":
              fallbackContent = `Navodaya Class 9 Science. Topics: Physics fundamentals (motion, force, work, energy), chemistry basics (atoms, molecules, chemical reactions), biology concepts (cells, tissues, life processes).`;
              break;
            case "English":
              fallbackContent = `Navodaya Class 9 English. Topics: Reading comprehension, grammar (tenses, voice, narration), vocabulary, sentence correction, paragraph writing, antonyms and synonyms.`;
              break;
            case "Hindi":
              fallbackContent = `Navodaya Class 9 Hindi. Topics: Reading comprehension (गद्यांश, पद्यांश), grammar (व्याकरण), vocabulary (शब्द भंडार), letter writing, essay writing.`;
              break;
            default:
              fallbackContent = `Navodaya Class 9 entrance exam curriculum focusing on ${section}.`;
          }
        }
        
        const previousQuestions = await storage.getNavodayaStudentPreviousQuestions(studentId);
        questions = await generateNavodayaQuizQuestions(
          fallbackContent,
          examGrade,
          medium,
          10,
          previousQuestions
        );
      }

      // Create Navodaya quiz session with section
      const session = await storage.createNavodayaQuizSession({
        studentId,
        pdfId: pdf?.id || null,
        examGrade: student.examGrade,
        section,
        medium: student.medium,
        questions,
        totalQuestions: questions.length, // Use actual count of generated questions
      });

      res.json({
        sessionId: session.id,
        questions,
      });
    } catch (error: unknown) {
      console.error("Error generating Navodaya quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to generate quiz";
      res.status(500).json({ error: message });
    }
  });

  // Submit Navodaya quiz results
  app.post("/api/navodaya/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, score } = req.body;

      if (!sessionId || answers === undefined || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await storage.updateNavodayaQuizSession(sessionId, {
        answers,
        score,
        completedAt: new Date(),
      });

      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }

      res.json({
        message: "Quiz completed",
        score,
        totalQuestions: session.totalQuestions,
      });
    } catch (error: unknown) {
      console.error("Error submitting Navodaya quiz:", error);
      const message = error instanceof Error ? error.message : "Failed to submit quiz";
      res.status(500).json({ error: message });
    }
  });

  // Get Navodaya student's quiz history
  app.get("/api/navodaya/students/:studentId/quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getNavodayaStudentQuizSessions(studentId);
      
      res.json(sessions.map(s => ({
        id: s.id,
        examGrade: s.examGrade,
        medium: s.medium,
        score: s.score,
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt,
      })));
    } catch (error) {
      console.error("Error fetching Navodaya quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Get detailed Navodaya quiz session for review
  app.get("/api/navodaya/quiz/:sessionId/review", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getNavodayaQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }
      
      res.json({
        id: session.id,
        examGrade: session.examGrade,
        medium: session.medium,
        score: session.score,
        totalQuestions: session.totalQuestions,
        questions: session.questions,
        answers: session.answers,
        completedAt: session.completedAt,
      });
    } catch (error) {
      console.error("Error fetching Navodaya quiz for review:", error);
      res.status(500).json({ error: "Failed to fetch quiz details" });
    }
  });

  // Admin: Get all Navodaya students with their progress
  app.get("/api/admin/navodaya-students", async (req, res) => {
    try {
      const allStudents = await storage.getAllNavodayaStudents();
      
      const studentsWithProgress = await Promise.all(
        allStudents.map(async (student) => {
          const sessions = await storage.getNavodayaStudentQuizSessions(student.id);
          const completedSessions = sessions.filter(s => s.completedAt);
          const totalQuizzes = completedSessions.length;
          const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.totalQuestions || 10), 0);
          const averageScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
          
          return {
            id: student.id,
            name: student.name,
            examGrade: student.examGrade,
            medium: student.medium,
            location: student.location,
            mobileNumber: student.mobileNumber,
            totalQuizzes,
            averageScore,
            sessions: completedSessions.map(s => ({
              id: s.id,
              examGrade: s.examGrade,
              score: s.score,
              totalQuestions: s.totalQuestions,
              completedAt: s.completedAt,
            })),
          };
        })
      );
      
      res.json(studentsWithProgress);
    } catch (error) {
      console.error("Error fetching Navodaya students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // ==================== CHAPTER PRACTICE ROUTES ====================

  // Admin: Get all Chapter Practice students with progress
  app.get("/api/admin/chapter-practice-students", async (req, res) => {
    try {
      const allStudents = await storage.getAllChapterPracticeStudents();
      
      const studentsWithProgress = await Promise.all(
        allStudents.map(async (student) => {
          const sessions = await storage.getChapterPracticeStudentQuizSessions(student.id);
          const completedSessions = sessions.filter(s => s.completedAt);
          const totalQuizzes = completedSessions.length;
          const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.totalQuestions || 10), 0);
          const averageScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
          
          return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            board: student.board,
            medium: student.medium,
            location: student.location,
            mobileNumber: student.mobileNumber,
            totalQuizzes,
            averageScore,
            sessions: completedSessions.map(s => ({
              id: s.id,
              subject: s.subject,
              chapterName: s.chapterName,
              score: s.score,
              totalQuestions: s.totalQuestions,
              completedAt: s.completedAt,
            })),
          };
        })
      );
      
      res.json(studentsWithProgress);
    } catch (error) {
      console.error("Error fetching Chapter Practice students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Chapter Practice Student registration
  app.post("/api/chapter-practice/students/register", async (req, res) => {
    try {
      const { name, schoolName, grade, board, medium, location, mobileNumber } = req.body;
      
      if (!name || !grade || !board || !location || !mobileNumber) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      const existingStudent = await storage.getChapterPracticeStudentByMobile(mobileNumber);
      if (existingStudent) {
        return res.json(existingStudent);
      }
      
      const student = await storage.createChapterPracticeStudent({
        name,
        schoolName: schoolName || null,
        grade,
        board,
        medium: medium || "English",
        location,
        mobileNumber,
      });
      res.json(student);
    } catch (error) {
      console.error("Error registering chapter practice student:", error);
      res.status(400).json({ error: "Failed to register student" });
    }
  });

  // Chapter Practice Student login
  app.post("/api/chapter-practice/students/login", async (req, res) => {
    try {
      const { name, mobileNumber } = req.body;
      
      if (!name || !mobileNumber) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }
      
      const student = await storage.getChapterPracticeStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please register first." });
      }
      
      if (student.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
        return res.status(404).json({ error: "Student not found. Please check your name and mobile number." });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error logging in chapter practice student:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get available subjects for chapter practice
  app.get("/api/chapter-practice/available-subjects", async (req, res) => {
    try {
      const { grade, board } = req.query;
      
      if (!grade || !board) {
        return res.status(400).json({ error: "Grade and board are required" });
      }
      
      const allPdfs = await storage.getActivePdfs();
      const normalizedGrade = (grade as string).toLowerCase();
      const normalizedBoard = (board as string).toUpperCase();
      
      const subjects = new Set<string>();
      
      // Check for Chapter Practice PDFs by filename pattern: contains "chapter_plan"
      for (const pdf of allPdfs) {
        const lowerFilename = pdf.filename.toLowerCase();
        if (lowerFilename.includes('chapter_plan') &&
            pdf.grade.toLowerCase() === normalizedGrade && 
            pdf.board.toUpperCase() === normalizedBoard && 
            !pdf.isArchived) {
          subjects.add(pdf.subject);
        }
      }
      
      res.json({ subjects: Array.from(subjects) });
    } catch (error) {
      console.error("Error fetching available subjects for chapter practice:", error);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  // Get available chapters for a subject
  app.get("/api/chapter-practice/available-chapters", async (req, res) => {
    try {
      const { grade, board, subject } = req.query;
      
      if (!grade || !board || !subject) {
        return res.status(400).json({ error: "Grade, board, and subject are required" });
      }
      
      const pdf = await storage.getChapterPracticePdf(grade as string, board as string, subject as string);
      
      if (!pdf) {
        return res.json({ chapters: [], pdfId: null });
      }
      
      const { parseQuestionsWithChapters } = await import("./questionParser");
      const { chapters } = parseQuestionsWithChapters(pdf.content);
      
      // Format chapter names with chapter numbers (e.g., "Chapter 1: Patterns in Mathematics")
      const chapterNames = chapters
        .filter(c => c.questionCount > 0)
        .map(c => `Chapter ${c.chapterNumber}: ${c.chapterName}`);
      
      res.json({ 
        chapters: chapterNames,
        pdfId: pdf.id
      });
    } catch (error) {
      console.error("Error fetching available chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // Get chapters for a subject based on student's grade and board
  app.get("/api/chapter-practice/chapters/:subject", async (req, res) => {
    try {
      const { subject } = req.params;
      const { grade, board } = req.query;
      
      if (!grade || !board) {
        return res.status(400).json({ error: "Grade and board are required" });
      }
      
      const pdf = await storage.getChapterPracticePdf(grade as string, board as string, subject);
      
      if (!pdf) {
        return res.json({ chapters: [], message: "No PDF found for this subject" });
      }
      
      const { parseQuestionsWithChapters } = await import("./questionParser");
      const { chapters } = parseQuestionsWithChapters(pdf.content);
      
      // Format chapter names with chapter numbers (e.g., "Chapter 1: Patterns in Mathematics")
      const formattedChapters = chapters
        .filter(c => c.questionCount > 0)
        .map(c => `Chapter ${c.chapterNumber}: ${c.chapterName}`);
      
      res.json({ 
        pdfId: pdf.id,
        chapters: formattedChapters,
        totalQuestions: pdf.totalQuestions || 0
      });
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // Generate chapter practice quiz (all questions from the chapter)
  app.post("/api/chapter-practice/quiz/generate", async (req, res) => {
    try {
      const { studentId, grade, board, subject, chapter, medium } = req.body;
      
      if (!studentId || !subject || !chapter) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const student = await storage.getChapterPracticeStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      const pdf = await storage.getChapterPracticePdf(
        grade || student.grade, 
        board || student.board, 
        subject
      );
      if (!pdf) {
        return res.status(404).json({ error: "PDF not found for this subject" });
      }
      
      const { parseQuestionsWithChapters, getQuestionsForChapterByName } = await import("./questionParser");
      const { questions: parsedQuestions, chapters } = parseQuestionsWithChapters(pdf.content);
      
      const chapterQuestions = getQuestionsForChapterByName(parsedQuestions, chapters, chapter);
      
      if (chapterQuestions.length === 0) {
        return res.status(400).json({ error: "No questions found for this chapter" });
      }
      
      const chapterInfo = chapters.find(c => c.name === chapter);
      const chapterNumber = chapterInfo?.chapterNumber || 1;
      
      console.log(`Generating chapter practice quiz for student ${studentId}, chapter "${chapter}": ${chapterQuestions.length} questions`);
      
      const questionsToSend = chapterQuestions.map(q => q.rawText).join('\n\n---\n\n');
      
      const generatedQuestions = await generateQuizQuestions(
        questionsToSend,
        medium || student.medium || "English",
        grade || student.grade,
        subject,
        chapterQuestions.length
      );
      
      const session = await storage.createChapterPracticeQuizSession({
        studentId,
        pdfId: pdf.id,
        subject,
        chapterNumber,
        chapterName: chapter,
        grade: grade || student.grade,
        board: board || student.board,
        medium: medium || student.medium || "English",
        totalQuestions: generatedQuestions.length,
        questions: generatedQuestions,
      });
      
      res.json({
        sessionId: session.id,
        questions: generatedQuestions,
        totalQuestions: generatedQuestions.length,
        chapterName: chapter,
      });
    } catch (error) {
      console.error("Error generating chapter practice quiz:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // Submit chapter practice quiz
  app.post("/api/chapter-practice/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, score } = req.body;
      
      if (!sessionId || !answers || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const session = await storage.getChapterPracticeQuizSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Quiz session not found" });
      }
      
      const updatedSession = await storage.updateChapterPracticeQuizSession(sessionId, {
        answers,
        score,
        completedAt: new Date(),
      });
      
      res.json({
        success: true,
        score,
        totalQuestions: session.totalQuestions,
      });
    } catch (error) {
      console.error("Error submitting chapter practice quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get chapter practice quiz history
  app.get("/api/chapter-practice/students/:studentId/quiz-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const sessions = await storage.getChapterPracticeStudentQuizSessions(studentId);
      
      res.json(sessions.map(s => ({
        id: s.id,
        subject: s.subject,
        chapterNumber: s.chapterNumber,
        chapterName: s.chapterName,
        score: s.score,
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt,
        questions: s.questions,
        answers: s.answers,
      })));
    } catch (error) {
      console.error("Error fetching chapter practice quiz history:", error);
      res.status(500).json({ error: "Failed to fetch quiz history" });
    }
  });

  // Weekly Leaderboard - IST timezone (Monday to Sunday)
  app.get("/api/leaderboard/weekly", async (req, res) => {
    // Prevent caching to ensure fresh data after student deletions
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      // IST is UTC+5:30
      const IST_OFFSET_HOURS = 5;
      const IST_OFFSET_MINUTES = 30;
      
      // Get current time in UTC
      const nowUtc = new Date();
      
      // Calculate IST day, hours, minutes from UTC
      const istTotalMinutes = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes() + IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES;
      const istDayOffset = istTotalMinutes >= 24 * 60 ? 1 : istTotalMinutes < 0 ? -1 : 0;
      
      // Get day of week in IST (0 = Sunday, 1 = Monday, ...)
      const utcDay = nowUtc.getUTCDay();
      const istDay = (utcDay + istDayOffset + 7) % 7;
      
      // Days since Monday in IST
      const daysFromMonday = istDay === 0 ? 6 : istDay - 1;
      
      // Monday 00:00:00 IST = Monday 18:30:00 UTC (previous day)
      // So Monday IST midnight = subtract 5:30 from midnight = previous day 18:30 UTC
      const mondayUtc = new Date(nowUtc);
      mondayUtc.setUTCDate(nowUtc.getUTCDate() - daysFromMonday - istDayOffset);
      mondayUtc.setUTCHours(0 - IST_OFFSET_HOURS, 0 - IST_OFFSET_MINUTES, 0, 0);
      
      // Sunday 23:59:59.999 IST = Sunday 18:29:59.999 UTC
      const sundayUtc = new Date(mondayUtc);
      sundayUtc.setUTCDate(mondayUtc.getUTCDate() + 7);
      sundayUtc.setUTCMilliseconds(sundayUtc.getUTCMilliseconds() - 1);
      
      const leaderboard = await storage.getWeeklyLeaderboard(mondayUtc, sundayUtc);
      
      // Format week range for display in IST
      const formatDateIST = (utcDate: Date) => {
        const istDate = new Date(utcDate.getTime() + (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000);
        const day = istDate.getUTCDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[istDate.getUTCMonth()]}`;
      };
      
      res.json({
        weekStart: formatDateIST(mondayUtc),
        weekEnd: formatDateIST(new Date(sundayUtc.getTime() - 1)),
        boardExam: leaderboard.boardExam,
        cpct: leaderboard.cpct,
        navodaya: leaderboard.navodaya,
      });
    } catch (error) {
      console.error("Error fetching weekly leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}
