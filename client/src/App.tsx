import { useState, useCallback, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import StudentOnboardingForm, { type StudentData } from "@/components/StudentOnboardingForm";
import QuizQuestion, { type Question } from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import AppHeader from "@/components/AppHeader";
import AdminPage from "@/pages/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import logoIcon from "@assets/Unklass_-_1_1765392666171.png";
import { useToast } from "@/hooks/use-toast";

type AppState = "onboarding" | "ready" | "loading" | "quiz" | "results";

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
  location: string;
  mobileNumber: string;
}

const SUBJECTS = [
  "Mathematics",
  "Science",
  "SST",
  "Hindi",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
] as const;

function App() {
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [studentData, setStudentData] = useState<RegisteredStudent | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const { toast } = useToast();

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

  const handleOnboardingSubmit = useCallback(async (data: StudentData) => {
    try {
      const response = await apiRequest("POST", "/api/students/register", {
        name: data.name,
        grade: data.grade,
        board: data.board,
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
    setAppState("ready");
  }, []);

  const score = answers.filter(a => a.isCorrect).length;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/admin" component={AdminPage} />
          <Route path="/">
            <div className="min-h-screen bg-background">
              {appState !== "onboarding" && (
                <AppHeader studentName={studentData?.name} />
              )}

              {appState === "onboarding" && (
                <StudentOnboardingForm onSubmit={handleOnboardingSubmit} onLogin={handleLogin} />
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
