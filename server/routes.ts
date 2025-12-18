import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertCpctStudentSchema, insertContactSubmissionSchema, type Question } from "@shared/schema";
import { generateQuizQuestions, generateAnswerFeedback, generateCpctQuizQuestions } from "./openai";
import multer from "multer";

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
      const { mobileNumber } = req.body;
      
      if (!mobileNumber) {
        return res.status(400).json({ error: "Mobile number is required" });
      }
      
      const student = await storage.getStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
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
      
      const allPdfs = await storage.getAllPdfs();
      const availableSubjects = allPdfs
        .filter(pdf => pdf.grade === grade && pdf.board === board)
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
      
      // Check for CPCT format: CPCT_Year.pdf (e.g., CPCT_2024.pdf)
      const cpctMatch = filename.match(/^CPCT_(\d{4})\.pdf$/i);
      
      // Check for Board Exam format: {grade}_{board}_{subject}.pdf
      const boardMatch = filename.match(/^(.+)_(.+)_(.+)\.pdf$/i);
      
      if (!cpctMatch && !boardMatch) {
        return res.status(400).json({ 
          error: "Invalid filename format. Expected: grade_board_subject.pdf (Board Exam) or CPCT_Year.pdf (CPCT)" 
        });
      }

      // Check if PDF already exists
      const existingPdf = await storage.getPdfByFilename(filename);
      if (existingPdf) {
        return res.status(409).json({ error: "PDF with this name already exists" });
      }

      // Extract text from PDF
      const content = await parsePdf(req.file.buffer);

      if (!content || content.trim().length < 100) {
        return res.status(400).json({ error: "PDF appears to be empty or contains too little text" });
      }

      let pdfData: { filename: string; grade: string; board: string; subject: string; content: string };
      
      if (cpctMatch) {
        // CPCT format - use special values
        pdfData = {
          filename,
          grade: "CPCT",
          board: "CPCT",
          subject: `CPCT ${cpctMatch[1]}`,
          content,
        };
      } else {
        // Board Exam format
        const [, grade, board, subject] = boardMatch!;
        pdfData = {
          filename,
          grade,
          board: board.toUpperCase(),
          subject,
          content,
        };
      }

      const pdf = await storage.createPdf(pdfData);

      res.json({ 
        message: "PDF uploaded successfully",
        pdf: {
          id: pdf.id,
          filename: pdf.filename,
          grade: pdf.grade,
          board: pdf.board,
          subject: pdf.subject,
          contentLength: content.length,
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
      })));
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      res.status(500).json({ error: "Failed to fetch PDFs" });
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

  // Delete PDF (admin)
  app.delete("/api/admin/pdfs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PDF ID" });
      }
      const deleted = await storage.deletePdf(id);
      if (!deleted) {
        return res.status(404).json({ error: "PDF not found" });
      }
      res.json({ message: "PDF deleted successfully" });
    } catch (error) {
      console.error("Error deleting PDF:", error);
      res.status(500).json({ error: "Failed to delete PDF" });
    }
  });

  // Generate quiz questions
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const { studentId, grade, board, subject, medium } = req.body;

      if (!studentId || !grade || !board || !subject) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Use student's medium preference or default to English
      const studentMedium = medium || student.medium || "English";

      // Find the PDF for this grade/board/subject
      const pdf = await storage.getPdfByGradeBoardSubject(grade, board.toUpperCase(), subject);
      
      // Get previous questions to avoid duplicates
      const previousQuestions = await storage.getStudentPreviousQuestions(studentId, subject);
      console.log(`Student ${studentId} has ${previousQuestions.length} previous questions for ${subject} in ${studentMedium} medium`);
      
      let questions: Question[];
      
      if (pdf) {
        // Generate questions from PDF content
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
        questions = await generateQuizQuestions(
          `General ${subject} curriculum for ${grade} grade students in ${board} board, India.`,
          subject,
          grade,
          board,
          10,
          previousQuestions,
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
        totalQuestions: 10,
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
      
      if (!mobileNumber) {
        return res.status(400).json({ error: "Mobile number is required" });
      }
      
      const student = await storage.getCpctStudentByMobile(mobileNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found. Please register first." });
      }
      
      // Optionally verify name matches
      if (name && student.name.toLowerCase() !== name.toLowerCase()) {
        return res.status(400).json({ error: "Name does not match registered details" });
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

  // Get available CPCT years (PDFs named CPCT_Year.pdf)
  app.get("/api/cpct/available-years", async (req, res) => {
    try {
      const allPdfs = await storage.getAllPdfs();
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
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify CPCT student exists
      const student = await storage.getCpctStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get all available CPCT PDFs and combine content
      const allPdfs = await storage.getAllPdfs();
      const cpctPdfs = allPdfs.filter(pdf => 
        pdf.filename.startsWith("CPCT_") && pdf.filename.endsWith(".pdf")
      );
      
      // Combine content from all CPCT PDFs or use fallback
      let combinedContent = "";
      let usedYear = "2024"; // Default year for reference
      let usedPdfId: number | null = null;
      
      if (cpctPdfs.length > 0) {
        // Sort by year descending to prioritize latest content
        cpctPdfs.sort((a, b) => {
          const yearA = a.filename.match(/CPCT_(\d+)\.pdf/)?.[1] || "0";
          const yearB = b.filename.match(/CPCT_(\d+)\.pdf/)?.[1] || "0";
          return yearB.localeCompare(yearA);
        });
        
        // Use the latest PDF's year
        const latestMatch = cpctPdfs[0].filename.match(/CPCT_(\d+)\.pdf/);
        usedYear = latestMatch ? latestMatch[1] : "2024";
        usedPdfId = cpctPdfs[0].id;
        
        // Combine content from all PDFs
        combinedContent = cpctPdfs.map(pdf => pdf.content).join("\n\n");
      }
      
      // Get previous questions to avoid duplicates
      const previousQuestions = await storage.getCpctStudentPreviousQuestions(studentId);
      console.log(`CPCT Student ${studentId} has ${previousQuestions.length} previous questions`);
      
      let questions: Question[];
      const medium = student.medium as "Hindi" | "English";
      
      if (combinedContent) {
        // Generate questions from combined PDF content in student's selected medium
        questions = await generateCpctQuizQuestions(
          combinedContent,
          usedYear,
          medium,
          10,
          previousQuestions
        );
      } else {
        // Generate general CPCT questions (fallback when no PDF uploaded)
        questions = await generateCpctQuizQuestions(
          `General CPCT exam curriculum for computer proficiency certification in Madhya Pradesh, India. Topics include: Computer Fundamentals, Operating Systems (Windows), MS Office (Word, Excel, PowerPoint), Internet and Email, Basic Networking, Computer Security, Hindi Typing, English Typing.`,
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
        medium: student.medium,
        questions,
        totalQuestions: 10,
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

  return httpServer;
}
