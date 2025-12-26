import { useState, useCallback, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/components/LandingPage";
import StudentOnboardingForm, { type StudentData } from "@/components/StudentOnboardingForm";
import CpctOnboardingForm, { type CpctStudentData } from "@/components/CpctOnboardingForm";
import NavodayaOnboardingForm, { type NavodayaStudentData } from "@/components/NavodayaOnboardingForm";
import ChapterPracticeOnboardingForm, { type ChapterPracticeStudentData } from "@/components/ChapterPracticeOnboardingForm";
import UnifiedAuthForm, { type LoginData, type RegisterData } from "@/components/UnifiedAuthForm";
import BoardExamOptions, { type BoardExamOptionsData } from "@/components/BoardExamOptions";
import CPCTExamOptions, { type CPCTExamOptionsData } from "@/components/CPCTExamOptions";
import NavodayaExamOptions, { type NavodayaExamOptionsData } from "@/components/NavodayaExamOptions";
import ChapterPracticeOptions, { type ChapterPracticeOptionsData } from "@/components/ChapterPracticeOptions";
import QuizQuestion, { type Question } from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import QuizHistory from "@/components/QuizHistory";
import AppHeader from "@/components/AppHeader";
import AdminPage from "@/pages/admin";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Library } from "lucide-react";
import logoIcon from "@assets/Unklass_-_1_1765392666171.png";
import { useToast } from "@/hooks/use-toast";

type ExamType = "board_exam" | "cpct" | "navodaya" | "chapter_practice";

interface UnifiedStudent {
  id: number;
  name: string;
  fatherName: string;
  location: string;
  mobileNumber: string;
  schoolName?: string | null;
}

interface ExamProfile {
  lastSelections: Record<string, unknown> | null;
}

type AppState = "landing" | "onboarding" | "ready" | "loading" | "quiz" | "results" | "history" 
  | "cpct-onboarding" | "cpct-ready" | "cpct-loading" | "cpct-quiz" | "cpct-results" | "cpct-history"
  | "navodaya-onboarding" | "navodaya-ready" | "navodaya-loading" | "navodaya-quiz" | "navodaya-results" | "navodaya-history"
  | "chapter-practice-onboarding" | "chapter-practice-ready" | "chapter-practice-loading" | "chapter-practice-quiz" | "chapter-practice-results"
  | "unified-auth" | "unified-board-options" | "unified-cpct-options" | "unified-navodaya-options" | "unified-chapter-options"
  | "unified-board-history" | "unified-cpct-history" | "unified-navodaya-history" | "unified-chapter-history";

interface QuizAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

interface RegisteredStudent {
  id: number;
  name: string;
  grade: string;
  board: string;
  medium: string;
  location: string;
  mobileNumber: string;
}

interface RegisteredCpctStudent {
  id: number;
  name: string;
  medium: string;
  location: string;
  mobileNumber: string;
}

interface RegisteredNavodayaStudent {
  id: number;
  name: string;
  examGrade: string;
  medium: string;
  location: string;
  mobileNumber: string;
}

interface RegisteredChapterPracticeStudent {
  id: number;
  name: string;
  grade: string;
  board: string;
  medium: string;
  location: string;
  mobileNumber: string;
}

const SUBJECTS = [
  "Mathematics",
  "Science",
  "SST",
  "Hindi",
  "English",
] as const;

// All CPCT sections
const CPCT_SECTIONS = [
  "MS Office",
  "Software Operating System & IT Fundamentals",
  "Internet, Networking & Security",
  "Hardware Peripheral & Devices",
  "Aptitude & Logical Reasoning",
] as const;

// Navodaya sections by grade
const NAVODAYA_SECTIONS_6TH = [
  "Mental Ability Test",
  "Arithmetic Test",
  "Language Test",
] as const;

const NAVODAYA_SECTIONS_9TH = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
] as const;

function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [studentData, setStudentData] = useState<RegisteredStudent | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Track website visits
  useEffect(() => {
    const trackVisit = async () => {
      const today = new Date().toISOString().split('T')[0];
      const visitKey = `unklass_visit_${today}`;
      
      // Check if already tracked today
      if (!localStorage.getItem(visitKey)) {
        try {
          await apiRequest("POST", "/api/analytics/visit", {});
          localStorage.setItem(visitKey, "true");
        } catch (error) {
          // Silently fail - visitor tracking is not critical
          console.log("Visit tracking failed");
        }
      }
    };
    
    trackVisit();
  }, []);
  
  // CPCT state
  const [cpctStudentData, setCpctStudentData] = useState<RegisteredCpctStudent | null>(null);
  const [selectedCpctSection, setSelectedCpctSection] = useState<string>("");
  const [cpctQuestions, setCpctQuestions] = useState<Question[]>([]);
  const [cpctCurrentQuestionIndex, setCpctCurrentQuestionIndex] = useState(0);
  const [cpctAnswers, setCpctAnswers] = useState<QuizAnswer[]>([]);
  const [cpctSessionId, setCpctSessionId] = useState<number | null>(null);
  const [availableCpctSections, setAvailableCpctSections] = useState<string[]>([]);
  
  // Navodaya state
  const [navodayaStudentData, setNavodayaStudentData] = useState<RegisteredNavodayaStudent | null>(null);
  const [selectedNavodayaSection, setSelectedNavodayaSection] = useState<string>("");
  const [navodayaQuestions, setNavodayaQuestions] = useState<Question[]>([]);
  const [navodayaCurrentQuestionIndex, setNavodayaCurrentQuestionIndex] = useState(0);
  const [navodayaAnswers, setNavodayaAnswers] = useState<QuizAnswer[]>([]);
  const [navodayaSessionId, setNavodayaSessionId] = useState<number | null>(null);
  const [availableNavodayaSections, setAvailableNavodayaSections] = useState<string[]>([]);
  
  // Chapter Practice state
  const [chapterPracticeStudentData, setChapterPracticeStudentData] = useState<RegisteredChapterPracticeStudent | null>(null);
  const [selectedChapterPracticeSubject, setSelectedChapterPracticeSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [chapterPracticeQuestions, setChapterPracticeQuestions] = useState<Question[]>([]);
  const [chapterPracticeCurrentQuestionIndex, setChapterPracticeCurrentQuestionIndex] = useState(0);
  const [chapterPracticeAnswers, setChapterPracticeAnswers] = useState<QuizAnswer[]>([]);
  const [chapterPracticeSessionId, setChapterPracticeSessionId] = useState<number | null>(null);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [availableChapterPracticeSubjects, setAvailableChapterPracticeSubjects] = useState<string[]>([]);

  // Unified auth state - restore from localStorage if available
  const [unifiedStudent, setUnifiedStudent] = useState<UnifiedStudent | null>(() => {
    try {
      const stored = localStorage.getItem("unifiedStudent");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(() => {
    try {
      const stored = localStorage.getItem("selectedExamType");
      return stored ? (stored as ExamType) : null;
    } catch {
      return null;
    }
  });
  const [examProfile, setExamProfile] = useState<ExamProfile | null>(null);

  // Persist unified student to localStorage
  useEffect(() => {
    if (unifiedStudent) {
      localStorage.setItem("unifiedStudent", JSON.stringify(unifiedStudent));
    } else {
      localStorage.removeItem("unifiedStudent");
    }
  }, [unifiedStudent]);

  // Persist selected exam type to localStorage
  useEffect(() => {
    if (selectedExamType) {
      localStorage.setItem("selectedExamType", selectedExamType);
    } else {
      localStorage.removeItem("selectedExamType");
    }
  }, [selectedExamType]);
  
  const { toast } = useToast();

  // Load exam profile when unified student selects an exam type
  useEffect(() => {
    if (unifiedStudent && selectedExamType) {
      fetch(`/api/auth/student/${unifiedStudent.id}/profile/${selectedExamType}`)
        .then(res => res.json())
        .then(data => {
          setExamProfile(data);
        })
        .catch(err => {
          console.error("Failed to fetch exam profile:", err);
          setExamProfile(null);
        });
    }
  }, [unifiedStudent, selectedExamType]);

  // Fetch available subjects when student is ready
  useEffect(() => {
    if (studentData && appState === "ready") {
      fetch(`/api/available-subjects?grade=${encodeURIComponent(studentData.grade)}&board=${encodeURIComponent(studentData.board)}`)
        .then(res => res.json())
        .then(data => {
          setAvailableSubjects(data.subjects || []);
        })
        .catch(err => {
          console.error("Failed to fetch available subjects:", err);
          setAvailableSubjects([]);
        });
    }
  }, [studentData, appState]);

  // Fetch available CPCT sections when CPCT student is ready
  useEffect(() => {
    if (cpctStudentData && appState === "cpct-ready") {
      fetch("/api/cpct/available-sections")
        .then(res => res.json())
        .then(data => {
          setAvailableCpctSections(data.sections || []);
        })
        .catch(err => {
          console.error("Failed to fetch available CPCT sections:", err);
          setAvailableCpctSections([]);
        });
    }
  }, [cpctStudentData, appState]);

  // Fetch available Navodaya sections when Navodaya student is ready
  useEffect(() => {
    if (navodayaStudentData && appState === "navodaya-ready") {
      fetch(`/api/navodaya/available-sections?grade=${encodeURIComponent(navodayaStudentData.examGrade)}`)
        .then(res => res.json())
        .then(data => {
          setAvailableNavodayaSections(data.sections || []);
        })
        .catch(err => {
          console.error("Failed to fetch available Navodaya sections:", err);
          setAvailableNavodayaSections([]);
        });
    }
  }, [navodayaStudentData, appState]);

  // Fetch available subjects for chapter practice
  useEffect(() => {
    if (chapterPracticeStudentData && appState === "chapter-practice-ready") {
      fetch(`/api/chapter-practice/available-subjects?grade=${encodeURIComponent(chapterPracticeStudentData.grade)}&board=${encodeURIComponent(chapterPracticeStudentData.board)}`)
        .then(res => res.json())
        .then(data => {
          setAvailableChapterPracticeSubjects(data.subjects || []);
        })
        .catch(err => {
          console.error("Failed to fetch available subjects:", err);
          setAvailableChapterPracticeSubjects([]);
        });
    }
  }, [chapterPracticeStudentData, appState]);

  // Fetch available chapters when subject is selected
  useEffect(() => {
    if (chapterPracticeStudentData && selectedChapterPracticeSubject && appState === "chapter-practice-ready") {
      fetch(`/api/chapter-practice/available-chapters?grade=${encodeURIComponent(chapterPracticeStudentData.grade)}&board=${encodeURIComponent(chapterPracticeStudentData.board)}&subject=${encodeURIComponent(selectedChapterPracticeSubject)}`)
        .then(res => res.json())
        .then(data => {
          setAvailableChapters(data.chapters || []);
          setSelectedChapter("");
        })
        .catch(err => {
          console.error("Failed to fetch available chapters:", err);
          setAvailableChapters([]);
        });
    }
  }, [chapterPracticeStudentData, selectedChapterPracticeSubject, appState]);

  const handleOnboardingSubmit = useCallback(async (data: StudentData) => {
    try {
      const response = await apiRequest("POST", "/api/students/register", {
        name: data.name,
        grade: data.grade,
        board: data.board,
        medium: data.medium,
        location: data.location,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      setStudentData(student);
      setAppState("ready");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleLogin = useCallback(async (data: { name: string; mobile: string }): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/students/login", {
        name: data.name,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      if (student && student.id) {
        setStudentData(student);
        setAppState("ready");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }, []);

  const handleStartQuiz = useCallback(async () => {
    if (!selectedSubject || !studentData) return;
    
    setAppState("loading");
    
    try {
      const response = await apiRequest("POST", "/api/quiz/generate", {
        studentId: studentData.id,
        grade: studentData.grade,
        board: studentData.board,
        subject: selectedSubject,
        medium: studentData.medium,
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setAppState("quiz");
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("ready");
    }
  }, [selectedSubject, studentData, toast]);

  const handleAnswer = useCallback((selectedOption: number, isCorrect: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    }]);
  }, [questions, currentQuestionIndex]);

  const handleNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed - submit results
      const finalScore = answers.filter(a => a.isCorrect).length + 
        (answers[answers.length - 1]?.isCorrect ? 0 : 0); // Already counted
      const actualScore = [...answers].filter(a => a.isCorrect).length;
      
      if (sessionId) {
        try {
          await apiRequest("POST", "/api/quiz/submit", {
            sessionId,
            answers,
            score: actualScore,
          });
        } catch (error) {
          console.error("Failed to submit quiz results:", error);
        }
      }
      
      setAppState("results");
    }
  }, [currentQuestionIndex, questions.length, answers, sessionId]);

  const handleRetakeQuiz = useCallback(async () => {
    if (!selectedSubject || !studentData) return;
    
    setAppState("loading");
    
    try {
      const response = await apiRequest("POST", "/api/quiz/generate", {
        studentId: studentData.id,
        grade: studentData.grade,
        board: studentData.board,
        subject: selectedSubject,
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setAppState("quiz");
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("results");
    }
  }, [selectedSubject, studentData, toast]);

  const handleTryAnotherSubject = useCallback(() => {
    setSelectedSubject("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSessionId(null);
    // Return to unified options if came from unified flow
    if (unifiedStudent) {
      setAppState("unified-board-options");
    } else {
      setAppState("ready");
    }
  }, [unifiedStudent]);

  // Function to start CPCT quiz with selected section
  const startCpctQuizWithSection = useCallback(async (section: string) => {
    if (!cpctStudentData) return;
    
    setAppState("cpct-loading");
    
    try {
      const response = await apiRequest("POST", "/api/cpct/quiz/generate", {
        studentId: cpctStudentData.id,
        section: section,
      });
      
      const data = await response.json();
      setCpctSessionId(data.sessionId);
      setCpctQuestions(data.questions);
      setCpctCurrentQuestionIndex(0);
      setCpctAnswers([]);
      setAppState("cpct-quiz");
    } catch (error) {
      console.error("CPCT Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("cpct-ready");
    }
  }, [cpctStudentData, toast]);

  // CPCT Handlers
  const handleCpctOnboardingSubmit = useCallback(async (data: CpctStudentData) => {
    try {
      const response = await apiRequest("POST", "/api/cpct/students/register", {
        name: data.name,
        medium: data.medium,
        location: data.location,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      setCpctStudentData(student);
      // Go to section selection after registration
      setAppState("cpct-ready");
    } catch (error) {
      console.error("CPCT Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleCpctLogin = useCallback(async (data: { name: string; mobile: string }): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/cpct/students/login", {
        name: data.name,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      if (student && student.id) {
        setCpctStudentData(student);
        // Go to section selection after login
        setAppState("cpct-ready");
        return true;
      }
      return false;
    } catch (error) {
      console.error("CPCT Login error:", error);
      return false;
    }
  }, []);

  const handleCpctStartQuiz = useCallback(async () => {
    if (!cpctStudentData || !selectedCpctSection) return;
    startCpctQuizWithSection(selectedCpctSection);
  }, [cpctStudentData, selectedCpctSection, startCpctQuizWithSection]);

  const handleCpctAnswer = useCallback((selectedOption: number, isCorrect: boolean) => {
    const currentQuestion = cpctQuestions[cpctCurrentQuestionIndex];
    setCpctAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    }]);
  }, [cpctQuestions, cpctCurrentQuestionIndex]);

  const handleCpctNextQuestion = useCallback(async () => {
    if (cpctCurrentQuestionIndex < cpctQuestions.length - 1) {
      setCpctCurrentQuestionIndex(prev => prev + 1);
    } else {
      const actualScore = [...cpctAnswers].filter(a => a.isCorrect).length;
      
      if (cpctSessionId) {
        try {
          await apiRequest("POST", "/api/cpct/quiz/submit", {
            sessionId: cpctSessionId,
            answers: cpctAnswers,
            score: actualScore,
          });
        } catch (error) {
          console.error("Failed to submit CPCT quiz results:", error);
        }
      }
      
      setAppState("cpct-results");
    }
  }, [cpctCurrentQuestionIndex, cpctQuestions.length, cpctAnswers, cpctSessionId]);

  const handleCpctRetakeQuiz = useCallback(async () => {
    if (!cpctStudentData || !selectedCpctSection) return;
    startCpctQuizWithSection(selectedCpctSection);
  }, [cpctStudentData, selectedCpctSection, startCpctQuizWithSection]);

  const handleCpctTryAnotherSection = useCallback(() => {
    setSelectedCpctSection("");
    setCpctQuestions([]);
    setCpctCurrentQuestionIndex(0);
    setCpctAnswers([]);
    setCpctSessionId(null);
    // Return to unified options if came from unified flow
    if (unifiedStudent) {
      setAppState("unified-cpct-options");
    } else {
      setAppState("cpct-ready");
    }
  }, [unifiedStudent]);

  const handleCpctViewHistory = useCallback(() => {
    setAppState("cpct-history");
  }, []);

  // Function to start Navodaya quiz with section
  const startNavodayaQuizWithSection = useCallback(async (section: string) => {
    if (!navodayaStudentData) return;
    
    setAppState("navodaya-loading");
    
    try {
      const response = await apiRequest("POST", "/api/navodaya/quiz/generate", {
        studentId: navodayaStudentData.id,
        section,
      });
      
      const data = await response.json();
      setNavodayaSessionId(data.sessionId);
      setNavodayaQuestions(data.questions);
      setNavodayaCurrentQuestionIndex(0);
      setNavodayaAnswers([]);
      setAppState("navodaya-quiz");
    } catch (error) {
      console.error("Navodaya Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("navodaya-ready");
    }
  }, [navodayaStudentData, toast]);

  // Navodaya Handlers
  const handleNavodayaOnboardingSubmit = useCallback(async (data: NavodayaStudentData) => {
    try {
      const response = await apiRequest("POST", "/api/navodaya/students/register", {
        name: data.name,
        examGrade: data.examGrade,
        medium: data.medium,
        location: data.location,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      setNavodayaStudentData(student);
      setSelectedNavodayaSection("");
      setAppState("navodaya-ready");
    } catch (error) {
      console.error("Navodaya Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleNavodayaLogin = useCallback(async (data: { name: string; mobile: string }): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/navodaya/students/login", {
        name: data.name,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      if (student && student.id) {
        setNavodayaStudentData(student);
        setSelectedNavodayaSection("");
        setAppState("navodaya-ready");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Navodaya Login error:", error);
      return false;
    }
  }, []);

  const handleNavodayaStartQuiz = useCallback(() => {
    if (!navodayaStudentData || !selectedNavodayaSection) return;
    startNavodayaQuizWithSection(selectedNavodayaSection);
  }, [navodayaStudentData, selectedNavodayaSection, startNavodayaQuizWithSection]);

  const handleNavodayaAnswer = useCallback((selectedOption: number, isCorrect: boolean) => {
    const currentQuestion = navodayaQuestions[navodayaCurrentQuestionIndex];
    setNavodayaAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    }]);
  }, [navodayaQuestions, navodayaCurrentQuestionIndex]);

  const handleNavodayaNextQuestion = useCallback(async () => {
    if (navodayaCurrentQuestionIndex < navodayaQuestions.length - 1) {
      setNavodayaCurrentQuestionIndex(prev => prev + 1);
    } else {
      const actualScore = [...navodayaAnswers].filter(a => a.isCorrect).length;
      
      if (navodayaSessionId) {
        try {
          await apiRequest("POST", "/api/navodaya/quiz/submit", {
            sessionId: navodayaSessionId,
            answers: navodayaAnswers,
            score: actualScore,
          });
        } catch (error) {
          console.error("Failed to submit Navodaya quiz results:", error);
        }
      }
      
      setAppState("navodaya-results");
    }
  }, [navodayaCurrentQuestionIndex, navodayaQuestions.length, navodayaAnswers, navodayaSessionId]);

  const handleNavodayaRetakeQuiz = useCallback(async () => {
    if (!navodayaStudentData) return;
    setSelectedNavodayaSection("");
    // Return to unified options if came from unified flow
    if (unifiedStudent) {
      setAppState("unified-navodaya-options");
    } else {
      setAppState("navodaya-ready");
    }
  }, [navodayaStudentData, unifiedStudent]);

  const handleNavodayaViewHistory = useCallback(() => {
    setAppState("navodaya-history");
  }, []);

  // Chapter Practice handlers
  const handleChapterPracticeOnboardingSubmit = useCallback(async (data: ChapterPracticeStudentData) => {
    try {
      const response = await apiRequest("POST", "/api/chapter-practice/students/register", {
        name: data.name,
        schoolName: data.schoolName,
        grade: data.grade,
        board: data.board,
        medium: data.medium,
        location: data.location,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      setChapterPracticeStudentData(student);
      setAppState("chapter-practice-ready");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleChapterPracticeLogin = useCallback(async (data: { name: string; mobile: string }): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/chapter-practice/students/login", {
        name: data.name,
        mobileNumber: data.mobile,
      });
      const student = await response.json();
      if (student && student.id) {
        setChapterPracticeStudentData(student);
        setAppState("chapter-practice-ready");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }, []);

  const handleChapterPracticeStartQuiz = useCallback(async () => {
    if (!selectedChapter || !selectedChapterPracticeSubject || !chapterPracticeStudentData) return;
    
    setAppState("chapter-practice-loading");
    
    try {
      const response = await apiRequest("POST", "/api/chapter-practice/quiz/generate", {
        studentId: chapterPracticeStudentData.id,
        grade: chapterPracticeStudentData.grade,
        board: chapterPracticeStudentData.board,
        subject: selectedChapterPracticeSubject,
        chapter: selectedChapter,
        medium: chapterPracticeStudentData.medium,
      });
      
      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        const formattedQuestions: Question[] = data.questions.map((q: any, idx: number) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
        }));
        
        setChapterPracticeQuestions(formattedQuestions);
        setChapterPracticeCurrentQuestionIndex(0);
        setChapterPracticeAnswers([]);
        setChapterPracticeSessionId(data.sessionId);
        setAppState("chapter-practice-quiz");
      } else {
        toast({
          title: "No questions available",
          description: "No questions found for this chapter. Please try another chapter.",
          variant: "destructive",
        });
        setAppState("chapter-practice-ready");
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("chapter-practice-ready");
    }
  }, [selectedChapter, selectedChapterPracticeSubject, chapterPracticeStudentData, toast]);

  const handleChapterPracticeAnswer = useCallback((selectedOption: number, isCorrect: boolean) => {
    const currentQuestion = chapterPracticeQuestions[chapterPracticeCurrentQuestionIndex];
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    };
    setChapterPracticeAnswers(prev => [...prev, newAnswer]);
  }, [chapterPracticeQuestions, chapterPracticeCurrentQuestionIndex]);

  const handleChapterPracticeNext = useCallback(async () => {
    if (chapterPracticeCurrentQuestionIndex < chapterPracticeQuestions.length - 1) {
      setChapterPracticeCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit results
      if (chapterPracticeSessionId) {
        try {
          await apiRequest("POST", "/api/chapter-practice/quiz/submit", {
            sessionId: chapterPracticeSessionId,
            answers: chapterPracticeAnswers,
            score: chapterPracticeAnswers.filter(a => a.isCorrect).length,
            totalQuestions: chapterPracticeQuestions.length,
          });
        } catch (error) {
          console.error("Failed to submit quiz results:", error);
        }
      }
      
      setAppState("chapter-practice-results");
    }
  }, [chapterPracticeCurrentQuestionIndex, chapterPracticeQuestions.length, chapterPracticeAnswers, chapterPracticeSessionId]);

  // ==================== UNIFIED AUTH HANDLERS ====================

  // Handle card click from landing page - show unified auth
  const handleUnifiedCardClick = useCallback((examType: ExamType) => {
    setSelectedExamType(examType);
    
    // If user is already logged in with unified auth, go straight to options
    if (unifiedStudent) {
      switch (examType) {
        case "board_exam":
          setAppState("unified-board-options");
          break;
        case "cpct":
          setAppState("unified-cpct-options");
          break;
        case "navodaya":
          setAppState("unified-navodaya-options");
          break;
        case "chapter_practice":
          setAppState("unified-chapter-options");
          break;
      }
    } else {
      setAppState("unified-auth");
    }
  }, [unifiedStudent]);

  // Handle unified login
  const handleUnifiedLogin = useCallback(async (data: LoginData): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        name: data.name,
        mobileNumber: data.mobileNumber,
      });
      const student = await response.json();
      if (student && student.id) {
        setUnifiedStudent(student);
        // Navigate to the exam-specific options
        switch (selectedExamType) {
          case "board_exam":
            setAppState("unified-board-options");
            break;
          case "cpct":
            setAppState("unified-cpct-options");
            break;
          case "navodaya":
            setAppState("unified-navodaya-options");
            break;
          case "chapter_practice":
            setAppState("unified-chapter-options");
            break;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Unified login error:", error);
      return false;
    }
  }, [selectedExamType]);

  // Handle unified registration
  const handleUnifiedRegister = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        name: data.name,
        fatherName: data.fatherName,
        location: data.location,
        mobileNumber: data.mobileNumber,
        schoolName: data.schoolName || null,
      });
      const student = await response.json();
      if (student && student.id) {
        setUnifiedStudent(student);
        // Navigate to the exam-specific options
        switch (selectedExamType) {
          case "board_exam":
            setAppState("unified-board-options");
            break;
          case "cpct":
            setAppState("unified-cpct-options");
            break;
          case "navodaya":
            setAppState("unified-navodaya-options");
            break;
          case "chapter_practice":
            setAppState("unified-chapter-options");
            break;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Unified registration error:", error);
      return false;
    }
  }, [selectedExamType]);

  // Save exam profile selections
  const handleSaveExamProfile = useCallback(async (selections: Record<string, unknown>) => {
    if (!unifiedStudent || !selectedExamType) return;
    
    try {
      await apiRequest("POST", `/api/auth/student/${unifiedStudent.id}/profile/${selectedExamType}`, {
        lastSelections: selections,
      });
      // Update local state
      setExamProfile({ lastSelections: selections });
    } catch (error) {
      console.error("Failed to save exam profile:", error);
    }
  }, [unifiedStudent, selectedExamType]);

  // Handle Board Exam submit from unified flow
  const handleUnifiedBoardExamSubmit = useCallback(async (data: BoardExamOptionsData) => {
    if (!unifiedStudent) return;
    
    // Create a compatible legacy student record for quiz generation
    const legacyStudent: RegisteredStudent = {
      id: unifiedStudent.id,
      name: unifiedStudent.name,
      grade: data.grade,
      board: data.board,
      medium: data.medium,
      location: unifiedStudent.location,
      mobileNumber: unifiedStudent.mobileNumber,
    };
    
    setStudentData(legacyStudent);
    setSelectedSubject(data.subject);
    setAppState("loading");
    
    try {
      const response = await apiRequest("POST", "/api/quiz/generate", {
        studentId: unifiedStudent.id,
        grade: data.grade,
        board: data.board,
        subject: data.subject,
        medium: data.medium,
        useUnifiedAuth: true,
      });
      
      const quizData = await response.json();
      setSessionId(quizData.sessionId);
      setQuestions(quizData.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setAppState("quiz");
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("unified-board-options");
    }
  }, [unifiedStudent, toast]);

  // Handle CPCT Exam submit from unified flow
  const handleUnifiedCPCTSubmit = useCallback(async (data: CPCTExamOptionsData) => {
    if (!unifiedStudent) return;
    
    const legacyCpctStudent: RegisteredCpctStudent = {
      id: unifiedStudent.id,
      name: unifiedStudent.name,
      medium: data.medium,
      location: unifiedStudent.location,
      mobileNumber: unifiedStudent.mobileNumber,
    };
    
    setCpctStudentData(legacyCpctStudent);
    setSelectedCpctSection(data.section);
    setAppState("cpct-loading");
    
    try {
      const response = await apiRequest("POST", "/api/cpct/quiz/generate", {
        studentId: unifiedStudent.id,
        section: data.section,
      });
      
      const quizData = await response.json();
      setCpctSessionId(quizData.sessionId);
      setCpctQuestions(quizData.questions);
      setCpctCurrentQuestionIndex(0);
      setCpctAnswers([]);
      setAppState("cpct-quiz");
    } catch (error) {
      console.error("CPCT Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("unified-cpct-options");
    }
  }, [unifiedStudent, toast]);

  // Handle Navodaya Exam submit from unified flow
  const handleUnifiedNavodayaSubmit = useCallback(async (data: NavodayaExamOptionsData) => {
    if (!unifiedStudent) return;
    
    const legacyNavodayaStudent: RegisteredNavodayaStudent = {
      id: unifiedStudent.id,
      name: unifiedStudent.name,
      examGrade: data.examGrade,
      medium: data.medium,
      location: unifiedStudent.location,
      mobileNumber: unifiedStudent.mobileNumber,
    };
    
    setNavodayaStudentData(legacyNavodayaStudent);
    setSelectedNavodayaSection(data.section);
    setAppState("navodaya-loading");
    
    try {
      const response = await apiRequest("POST", "/api/navodaya/quiz/generate", {
        studentId: unifiedStudent.id,
        section: data.section,
      });
      
      const quizData = await response.json();
      setNavodayaSessionId(quizData.sessionId);
      setNavodayaQuestions(quizData.questions);
      setNavodayaCurrentQuestionIndex(0);
      setNavodayaAnswers([]);
      setAppState("navodaya-quiz");
    } catch (error) {
      console.error("Navodaya Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("unified-navodaya-options");
    }
  }, [unifiedStudent, toast]);

  // Handle Chapter Practice submit from unified flow
  const handleUnifiedChapterPracticeSubmit = useCallback(async (data: ChapterPracticeOptionsData) => {
    if (!unifiedStudent) return;
    
    const legacyChapterStudent: RegisteredChapterPracticeStudent = {
      id: unifiedStudent.id,
      name: unifiedStudent.name,
      grade: data.grade,
      board: data.board,
      medium: data.medium,
      location: unifiedStudent.location,
      mobileNumber: unifiedStudent.mobileNumber,
    };
    
    setChapterPracticeStudentData(legacyChapterStudent);
    setSelectedChapterPracticeSubject(data.subject);
    setSelectedChapter(data.chapter);
    setAppState("chapter-practice-loading");
    
    try {
      const response = await apiRequest("POST", "/api/chapter-practice/quiz/generate", {
        studentId: unifiedStudent.id,
        grade: data.grade,
        board: data.board,
        subject: data.subject,
        chapter: data.chapter,
        medium: data.medium,
      });
      
      const quizData = await response.json();
      
      if (quizData.questions && quizData.questions.length > 0) {
        const formattedQuestions: Question[] = quizData.questions.map((q: any, idx: number) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
        }));
        
        setChapterPracticeQuestions(formattedQuestions);
        setChapterPracticeCurrentQuestionIndex(0);
        setChapterPracticeAnswers([]);
        setChapterPracticeSessionId(quizData.sessionId);
        setAppState("chapter-practice-quiz");
      } else {
        toast({
          title: "No questions available",
          description: "No questions found for this chapter.",
          variant: "destructive",
        });
        setAppState("unified-chapter-options");
      }
    } catch (error) {
      console.error("Chapter Practice Quiz generation error:", error);
      toast({
        title: "Failed to generate quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
      setAppState("unified-chapter-options");
    }
  }, [unifiedStudent, toast]);

  // Handle back to landing from unified flow
  const handleUnifiedBackToLanding = useCallback(() => {
    setSelectedExamType(null);
    setExamProfile(null);
    setAppState("landing");
  }, []);

  const score = answers.filter(a => a.isCorrect).length;
  const cpctScore = cpctAnswers.filter(a => a.isCorrect).length;
  const navodayaScore = navodayaAnswers.filter(a => a.isCorrect).length;
  const chapterPracticeScore = chapterPracticeAnswers.filter(a => a.isCorrect).length;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/admin" component={AdminPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/">
            <div className="min-h-screen bg-background">
              {appState !== "onboarding" && appState !== "landing" && appState !== "cpct-onboarding" && appState !== "navodaya-onboarding" && appState !== "chapter-practice-onboarding" && appState !== "unified-auth" && appState !== "unified-board-options" && appState !== "unified-cpct-options" && appState !== "unified-navodaya-options" && appState !== "unified-chapter-options" && (
                <AppHeader studentName={unifiedStudent?.name || studentData?.name || cpctStudentData?.name || navodayaStudentData?.name || chapterPracticeStudentData?.name} onLogoClick={() => setAppState("landing")} />
              )}

              {appState === "landing" && (
                <LandingPage 
                  onBoardExamClick={() => handleUnifiedCardClick("board_exam")}
                  onCPCTClick={() => handleUnifiedCardClick("cpct")}
                  onNavodayaClick={() => handleUnifiedCardClick("navodaya")}
                  onChapterPracticeClick={() => handleUnifiedCardClick("chapter_practice")}
                />
              )}

              {appState === "unified-auth" && (
                <UnifiedAuthForm
                  onLogin={handleUnifiedLogin}
                  onRegister={handleUnifiedRegister}
                  onBack={handleUnifiedBackToLanding}
                />
              )}

              {appState === "unified-board-options" && unifiedStudent && (
                <BoardExamOptions
                  studentId={unifiedStudent.id}
                  studentName={unifiedStudent.name}
                  savedSelections={examProfile?.lastSelections as { grade?: string; board?: string; medium?: string; subject?: string } | null}
                  onSubmit={handleUnifiedBoardExamSubmit}
                  onSaveSelections={handleSaveExamProfile}
                  onBack={handleUnifiedBackToLanding}
                  onViewHistory={() => setAppState("unified-board-history")}
                />
              )}

              {appState === "unified-cpct-options" && unifiedStudent && (
                <CPCTExamOptions
                  studentId={unifiedStudent.id}
                  studentName={unifiedStudent.name}
                  savedSelections={examProfile?.lastSelections as { medium?: string; section?: string } | null}
                  onSubmit={handleUnifiedCPCTSubmit}
                  onSaveSelections={handleSaveExamProfile}
                  onBack={handleUnifiedBackToLanding}
                  onViewHistory={() => setAppState("unified-cpct-history")}
                />
              )}

              {appState === "unified-navodaya-options" && unifiedStudent && (
                <NavodayaExamOptions
                  studentId={unifiedStudent.id}
                  studentName={unifiedStudent.name}
                  savedSelections={examProfile?.lastSelections as { medium?: string; examGrade?: string; section?: string } | null}
                  onSubmit={handleUnifiedNavodayaSubmit}
                  onSaveSelections={handleSaveExamProfile}
                  onBack={handleUnifiedBackToLanding}
                  onViewHistory={() => setAppState("unified-navodaya-history")}
                />
              )}

              {appState === "unified-chapter-options" && unifiedStudent && (
                <ChapterPracticeOptions
                  studentId={unifiedStudent.id}
                  studentName={unifiedStudent.name}
                  savedSelections={examProfile?.lastSelections as { grade?: string; board?: string; medium?: string; subject?: string; chapter?: string } | null}
                  onSubmit={handleUnifiedChapterPracticeSubmit}
                  onSaveSelections={handleSaveExamProfile}
                  onBack={handleUnifiedBackToLanding}
                />
              )}

              {appState === "unified-board-history" && unifiedStudent && (
                <QuizHistory
                  studentId={unifiedStudent.id}
                  onBack={() => setAppState("unified-board-options")}
                  useUnifiedAuth={true}
                />
              )}

              {appState === "unified-cpct-history" && unifiedStudent && (
                <QuizHistory
                  studentId={unifiedStudent.id}
                  onBack={() => setAppState("unified-cpct-options")}
                  historyType="cpct"
                  useUnifiedAuth={true}
                />
              )}

              {appState === "unified-navodaya-history" && unifiedStudent && (
                <QuizHistory
                  studentId={unifiedStudent.id}
                  onBack={() => setAppState("unified-navodaya-options")}
                  historyType="navodaya"
                  useUnifiedAuth={true}
                />
              )}

              {appState === "onboarding" && (
                <StudentOnboardingForm 
                  onSubmit={handleOnboardingSubmit} 
                  onLogin={handleLogin}
                  onBack={() => setAppState("landing")}
                />
              )}

              {appState === "ready" && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4">
                          <img 
                            src={logoIcon} 
                            alt="Unklass" 
                            className="w-full h-full object-cover"
                            data-testid="img-logo-icon"
                          />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">Select Your Subject</h1>
                        <p className="text-muted-foreground text-sm">
                          Choose a subject to start your quiz. You'll be presented with 10 multiple choice questions.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          {availableSubjects.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground border rounded-md bg-muted/30">
                              <p className="text-sm">No study materials available for {studentData?.grade} {studentData?.board} yet.</p>
                              <p className="text-xs mt-1">Please check back later or contact your administrator.</p>
                            </div>
                          ) : (
                            <Select 
                              value={selectedSubject} 
                              onValueChange={setSelectedSubject}
                            >
                              <SelectTrigger id="subject" data-testid="select-subject">
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBJECTS.map((subject) => {
                                  const isAvailable = availableSubjects.includes(subject);
                                  return (
                                    <SelectItem 
                                      key={subject} 
                                      value={subject}
                                      disabled={!isAvailable}
                                      className={!isAvailable ? "opacity-40" : ""}
                                    >
                                      {subject} {!isAvailable && "(Not Available)"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {studentData && (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Grade:</span> {studentData.grade} | 
                              <span className="font-medium text-foreground ml-2">Board:</span> {studentData.board}
                            </p>
                          </div>
                        )}

                        <Button 
                          className="w-full" 
                          onClick={handleStartQuiz}
                          disabled={!selectedSubject}
                          data-testid="button-start-quiz"
                        >
                          Start Quiz
                        </Button>

                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => setAppState("history")}
                          data-testid="button-view-history"
                        >
                          View Quiz History
                        </Button>

                        <Button 
                          variant="ghost"
                          className="w-full" 
                          onClick={() => {
                            setStudentData(null);
                            setAppState("landing");
                          }}
                          data-testid="button-back-landing"
                        >
                          Back to Home
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "loading" && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                      <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                      <h2 className="text-xl font-medium mb-2">Preparing Your Quiz</h2>
                      <p className="text-muted-foreground">
                        UNKLASS provides carefully selected important questions based on exam trends
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "quiz" && questions.length > 0 && (
                <QuizQuestion
                  question={questions[currentQuestionIndex]}
                  currentQuestion={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  onAnswer={handleAnswer}
                  onNext={handleNextQuestion}
                />
              )}

              {appState === "results" && (
                <QuizResults
                  score={score}
                  totalQuestions={questions.length}
                  onRetakeQuiz={handleRetakeQuiz}
                  onTryAnotherSubject={handleTryAnotherSubject}
                  onBackToHome={() => {
                    if (unifiedStudent) {
                      setAppState("unified-board-options");
                    } else {
                      setAppState("ready");
                    }
                  }}
                />
              )}

              {appState === "history" && studentData && (
                <QuizHistory
                  studentId={studentData.id}
                  onBack={() => setAppState("ready")}
                />
              )}

              {/* CPCT Exam Prep Sections */}
              {appState === "cpct-onboarding" && (
                <CpctOnboardingForm 
                  onSubmit={handleCpctOnboardingSubmit} 
                  onLogin={handleCpctLogin}
                  onBack={() => setAppState("landing")}
                />
              )}

              {appState === "cpct-ready" && cpctStudentData && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4">
                          <img 
                            src={logoIcon} 
                            alt="UNKLASS" 
                            className="w-full h-full object-cover"
                            data-testid="img-cpct-logo-icon"
                          />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">Select Your Section</h1>
                        <p className="text-muted-foreground text-sm">
                          Choose a section to start your CPCT quiz. You'll be presented with 10 multiple choice questions.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cpct-section">Section</Label>
                          <Select value={selectedCpctSection} onValueChange={setSelectedCpctSection}>
                            <SelectTrigger id="cpct-section" data-testid="select-cpct-section">
                              <SelectValue placeholder="Select a section" />
                            </SelectTrigger>
                            <SelectContent>
                              {CPCT_SECTIONS.map((section) => {
                                const isAvailable = availableCpctSections.includes(section);
                                return (
                                  <SelectItem 
                                    key={section} 
                                    value={section}
                                    disabled={!isAvailable}
                                    className={!isAvailable ? "opacity-40" : ""}
                                    data-testid={`option-cpct-section-${section}`}
                                  >
                                    {section} {!isAvailable && "(Not Available)"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {cpctStudentData && (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Name:</span> {cpctStudentData.name} | 
                              <span className="font-medium text-foreground ml-2">Medium:</span> {cpctStudentData.medium}
                            </p>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={handleCpctStartQuiz}
                          disabled={!selectedCpctSection}
                          data-testid="button-start-cpct-quiz"
                        >
                          Start Quiz
                        </Button>

                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={handleCpctViewHistory}
                          data-testid="button-cpct-history"
                        >
                          View Quiz History
                        </Button>

                        <Button 
                          variant="ghost"
                          className="w-full" 
                          onClick={() => {
                            setCpctStudentData(null);
                            setAppState("landing");
                          }}
                          data-testid="button-cpct-back-landing"
                        >
                          Back to Home
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "cpct-loading" && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                      <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                      <h2 className="text-xl font-medium mb-2">Preparing Your CPCT Quiz</h2>
                      <p className="text-muted-foreground">
                        UNKLASS provides carefully selected important questions based on exam trends
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "cpct-quiz" && cpctQuestions.length > 0 && (
                <QuizQuestion
                  question={cpctQuestions[cpctCurrentQuestionIndex]}
                  currentQuestion={cpctCurrentQuestionIndex + 1}
                  totalQuestions={cpctQuestions.length}
                  onAnswer={handleCpctAnswer}
                  onNext={handleCpctNextQuestion}
                />
              )}

              {appState === "cpct-results" && (
                <QuizResults
                  score={cpctScore}
                  totalQuestions={cpctQuestions.length}
                  onRetakeQuiz={handleCpctRetakeQuiz}
                  onTryAnotherSubject={handleCpctTryAnotherSection}
                  onBackToHome={() => {
                    setSelectedCpctSection("");
                    if (unifiedStudent) {
                      setAppState("unified-cpct-options");
                    } else {
                      setAppState("cpct-ready");
                    }
                  }}
                  subjectLabel="Try Another Section"
                />
              )}

              {appState === "cpct-history" && cpctStudentData && (
                <QuizHistory
                  studentId={cpctStudentData.id}
                  onBack={() => setAppState("cpct-ready")}
                  isCpct={true}
                />
              )}

              {/* Navodaya Exam Prep Sections */}
              {appState === "navodaya-onboarding" && (
                <NavodayaOnboardingForm 
                  onSubmit={handleNavodayaOnboardingSubmit} 
                  onLogin={handleNavodayaLogin}
                  onBack={() => setAppState("landing")}
                />
              )}

              {appState === "navodaya-ready" && navodayaStudentData && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4">
                          <img 
                            src={logoIcon} 
                            alt="UNKLASS" 
                            className="w-full h-full object-cover"
                            data-testid="img-navodaya-logo-icon"
                          />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">Select Your Section</h1>
                        <p className="text-muted-foreground text-sm">
                          Choose a section to start your Navodaya quiz. You'll be presented with 10 multiple choice questions.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="navodaya-section">Section</Label>
                          <Select value={selectedNavodayaSection} onValueChange={setSelectedNavodayaSection}>
                            <SelectTrigger id="navodaya-section" data-testid="select-navodaya-section">
                              <SelectValue placeholder="Select a section" />
                            </SelectTrigger>
                            <SelectContent>
                              {(navodayaStudentData.examGrade === "6th" ? NAVODAYA_SECTIONS_6TH : NAVODAYA_SECTIONS_9TH).map((section) => {
                                const isAvailable = availableNavodayaSections.includes(section);
                                return (
                                  <SelectItem 
                                    key={section} 
                                    value={section}
                                    disabled={!isAvailable}
                                    className={!isAvailable ? "opacity-40" : ""}
                                    data-testid={`option-navodaya-section-${section}`}
                                  >
                                    {section} {!isAvailable && "(Not Available)"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {navodayaStudentData && (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Grade:</span> {navodayaStudentData.examGrade} | 
                              <span className="font-medium text-foreground ml-2">Medium:</span> {navodayaStudentData.medium}
                            </p>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={handleNavodayaStartQuiz}
                          disabled={!selectedNavodayaSection}
                          data-testid="button-start-navodaya-quiz"
                        >
                          Start Quiz
                        </Button>

                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={handleNavodayaViewHistory}
                          data-testid="button-navodaya-history"
                        >
                          View Quiz History
                        </Button>

                        <Button 
                          variant="ghost"
                          className="w-full" 
                          onClick={() => {
                            setNavodayaStudentData(null);
                            setAppState("landing");
                          }}
                          data-testid="button-navodaya-back-landing"
                        >
                          Back to Home
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "navodaya-loading" && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                      <Loader2 className="w-12 h-12 mx-auto text-green-500 animate-spin mb-4" />
                      <h2 className="text-xl font-medium mb-2">Preparing Your Navodaya Quiz</h2>
                      <p className="text-muted-foreground">
                        UNKLASS provides carefully selected important questions for JNV entrance exam
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "navodaya-quiz" && navodayaQuestions.length > 0 && (
                <QuizQuestion
                  question={navodayaQuestions[navodayaCurrentQuestionIndex]}
                  currentQuestion={navodayaCurrentQuestionIndex + 1}
                  totalQuestions={navodayaQuestions.length}
                  onAnswer={handleNavodayaAnswer}
                  onNext={handleNavodayaNextQuestion}
                />
              )}

              {appState === "navodaya-results" && (
                <QuizResults
                  score={navodayaScore}
                  totalQuestions={navodayaQuestions.length}
                  onRetakeQuiz={handleNavodayaRetakeQuiz}
                  onTryAnotherSubject={handleNavodayaViewHistory}
                  onBackToHome={() => {
                    setSelectedNavodayaSection("");
                    if (unifiedStudent) {
                      setAppState("unified-navodaya-options");
                    } else {
                      setAppState("navodaya-ready");
                    }
                  }}
                  subjectLabel="View Quiz History"
                />
              )}

              {appState === "navodaya-history" && navodayaStudentData && (
                <QuizHistory
                  studentId={navodayaStudentData.id}
                  onBack={() => setAppState("navodaya-ready")}
                  isNavodaya={true}
                />
              )}

              {appState === "chapter-practice-onboarding" && (
                <ChapterPracticeOnboardingForm 
                  onSubmit={handleChapterPracticeOnboardingSubmit} 
                  onLogin={handleChapterPracticeLogin}
                  onBack={() => setAppState("landing")}
                />
              )}

              {appState === "chapter-practice-ready" && chapterPracticeStudentData && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4 bg-violet-50 flex items-center justify-center">
                          <Library className="h-8 w-8 text-violet-600" />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">Chapter Practice</h1>
                        <p className="text-muted-foreground text-sm">
                          Select a subject and chapter to practice all questions from that chapter.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="chapter-practice-subject">Subject</Label>
                          {availableChapterPracticeSubjects.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground border rounded-md bg-muted/30">
                              <p className="text-sm">No study materials available for {chapterPracticeStudentData.grade} {chapterPracticeStudentData.board} yet.</p>
                              <p className="text-xs mt-1">Please check back later.</p>
                            </div>
                          ) : (
                            <Select 
                              value={selectedChapterPracticeSubject} 
                              onValueChange={setSelectedChapterPracticeSubject}
                            >
                              <SelectTrigger id="chapter-practice-subject" data-testid="select-chapter-practice-subject">
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableChapterPracticeSubjects.map((subject) => (
                                  <SelectItem key={subject} value={subject}>
                                    {subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {selectedChapterPracticeSubject && (
                          <div className="space-y-2">
                            <Label htmlFor="chapter">Chapter</Label>
                            {availableChapters.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground border rounded-md bg-muted/30">
                                <p className="text-sm">No chapters available for this subject yet.</p>
                              </div>
                            ) : (
                              <Select 
                                value={selectedChapter} 
                                onValueChange={setSelectedChapter}
                              >
                                <SelectTrigger id="chapter" data-testid="select-chapter">
                                  <SelectValue placeholder="Select a chapter" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableChapters.map((chapter, index) => {
                                    const colors = [
                                      "bg-rose-100 dark:bg-rose-900/30",
                                      "bg-orange-100 dark:bg-orange-900/30",
                                      "bg-amber-100 dark:bg-amber-900/30",
                                      "bg-lime-100 dark:bg-lime-900/30",
                                      "bg-emerald-100 dark:bg-emerald-900/30",
                                      "bg-teal-100 dark:bg-teal-900/30",
                                      "bg-cyan-100 dark:bg-cyan-900/30",
                                      "bg-sky-100 dark:bg-sky-900/30",
                                      "bg-violet-100 dark:bg-violet-900/30",
                                      "bg-fuchsia-100 dark:bg-fuchsia-900/30",
                                    ];
                                    const colorClass = colors[index % colors.length];
                                    return (
                                      <SelectItem 
                                        key={chapter} 
                                        value={chapter}
                                        className={`${colorClass} my-1 rounded-md`}
                                      >
                                        {chapter}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Grade:</span> {chapterPracticeStudentData.grade} | 
                            <span className="font-medium text-foreground ml-2">Board:</span> {chapterPracticeStudentData.board}
                          </p>
                        </div>

                        <Button 
                          className="w-full bg-violet-600 hover:bg-violet-700" 
                          onClick={handleChapterPracticeStartQuiz}
                          disabled={!selectedChapter}
                          data-testid="button-start-chapter-practice"
                        >
                          Start Practice
                        </Button>

                        <Button 
                          variant="ghost"
                          className="w-full" 
                          onClick={() => {
                            setChapterPracticeStudentData(null);
                            setAppState("landing");
                          }}
                          data-testid="button-chapter-practice-back-landing"
                        >
                          Back to Home
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "chapter-practice-loading" && (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                  <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-violet-500" />
                      <h2 className="text-xl font-semibold mb-2">Preparing Your Practice</h2>
                      <p className="text-muted-foreground">
                        Loading questions from {selectedChapter}...
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {appState === "chapter-practice-quiz" && chapterPracticeQuestions.length > 0 && (
                <QuizQuestion
                  question={chapterPracticeQuestions[chapterPracticeCurrentQuestionIndex]}
                  currentQuestion={chapterPracticeCurrentQuestionIndex + 1}
                  totalQuestions={chapterPracticeQuestions.length}
                  onAnswer={handleChapterPracticeAnswer}
                  onNext={handleChapterPracticeNext}
                />
              )}

              {appState === "chapter-practice-results" && (
                <QuizResults
                  score={chapterPracticeScore}
                  totalQuestions={chapterPracticeQuestions.length}
                  questions={chapterPracticeQuestions}
                  answers={chapterPracticeAnswers}
                  onRetakeQuiz={() => {
                    setSelectedChapter("");
                    setSelectedChapterPracticeSubject("");
                    if (unifiedStudent) {
                      setAppState("unified-chapter-options");
                    } else {
                      setAppState("chapter-practice-ready");
                    }
                  }}
                  onTryAnotherSubject={() => {
                    setSelectedChapter("");
                    setSelectedChapterPracticeSubject("");
                    if (unifiedStudent) {
                      setAppState("unified-chapter-options");
                    } else {
                      setAppState("chapter-practice-ready");
                    }
                  }}
                  onBackToHome={() => {
                    setSelectedChapter("");
                    setSelectedChapterPracticeSubject("");
                    if (unifiedStudent) {
                      setAppState("unified-chapter-options");
                    } else {
                      setAppState("chapter-practice-ready");
                    }
                  }}
                  subjectLabel="Practice Another Chapter"
                  hideRetakeButton={true}
                />
              )}
            </div>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
