import type { Express } from "express";
import { createServer, type Server } from "http";
import { createRequire } from "module";
import { storage } from "./storage";
import { insertStudentSchema, type Question } from "@shared/schema";
import { generateQuizQuestions, generateAnswerFeedback } from "./openai";
import multer from "multer";

// Use createRequire for CommonJS pdf-parse module
const require = createRequire(import.meta.url);

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = require("pdf-parse");
  const data = await PDFParse(buffer);
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

  // Admin: Upload PDF
  app.post("/api/admin/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file provided" });
      }

      const filename = req.file.originalname;
      // Parse filename: {grade}_{board}_{subject}.pdf
      const match = filename.match(/^(.+)_(.+)_(.+)\.pdf$/i);
      if (!match) {
        return res.status(400).json({ 
          error: "Invalid filename format. Expected: {grade}_{board}_{subject}.pdf (e.g., 10th_MP_Mathematics.pdf)" 
        });
      }

      const [, grade, board, subject] = match;

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

      const pdf = await storage.createPdf({
        filename,
        grade,
        board: board.toUpperCase(),
        subject,
        content,
      });

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
      const { studentId, grade, board, subject } = req.body;

      if (!studentId || !grade || !board || !subject) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify student exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Find the PDF for this grade/board/subject
      const pdf = await storage.getPdfByGradeBoardSubject(grade, board.toUpperCase(), subject);
      
      let questions: Question[];
      
      if (pdf) {
        // Generate questions from PDF content
        questions = await generateQuizQuestions(
          pdf.content,
          subject,
          grade,
          board,
          10
        );
      } else {
        // Generate general questions for the subject (fallback when no PDF uploaded)
        questions = await generateQuizQuestions(
          `General ${subject} curriculum for ${grade} grade students in ${board} board, India.`,
          subject,
          grade,
          board,
          10
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

  return httpServer;
}
