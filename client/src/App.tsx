import { useState, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import StudentOnboardingForm, { type StudentData } from "@/components/StudentOnboardingForm";
import QuizQuestion, { type Question } from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

type AppState = "onboarding" | "ready" | "loading" | "quiz" | "results";

interface QuizAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

// todo: remove mock functionality - replace with actual API call
const mockQuestions: Question[] = [
  {
    id: 1,
    question: "What is the primary function of mitochondria in a cell?",
    options: ["Protein synthesis", "Energy production (ATP)", "Waste removal", "Cell division"],
    correctAnswer: 1,
    explanation: "Mitochondria are known as the 'powerhouse of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy."
  },
  {
    id: 2,
    question: "Which of the following is NOT a type of blood cell?",
    options: ["Red blood cells", "White blood cells", "Platelets", "Neurons"],
    correctAnswer: 3,
    explanation: "Neurons are nerve cells, not blood cells. The three main types of blood cells are red blood cells (erythrocytes), white blood cells (leukocytes), and platelets (thrombocytes)."
  },
  {
    id: 3,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum'. Ag is the symbol for silver (from Latin 'argentum')."
  },
  {
    id: 4,
    question: "Which planet is known as the 'Red Planet'?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    explanation: "Mars is called the 'Red Planet' because of its reddish appearance, which is caused by iron oxide (rust) on its surface."
  },
  {
    id: 5,
    question: "What is the process by which plants make their own food called?",
    options: ["Respiration", "Photosynthesis", "Transpiration", "Germination"],
    correctAnswer: 1,
    explanation: "Photosynthesis is the process by which plants convert light energy, usually from the sun, into chemical energy that can be used to fuel the plant's activities."
  },
  {
    id: 6,
    question: "Who wrote the national anthem of India?",
    options: ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Mahatma Gandhi"],
    correctAnswer: 0,
    explanation: "Jana Gana Mana, India's national anthem, was written by Nobel laureate Rabindranath Tagore. It was adopted as the national anthem on January 24, 1950."
  },
  {
    id: 7,
    question: "What is the SI unit of force?",
    options: ["Joule", "Watt", "Newton", "Pascal"],
    correctAnswer: 2,
    explanation: "The Newton (N) is the SI unit of force. It is defined as the force needed to accelerate 1 kilogram of mass at a rate of 1 meter per second squared."
  },
  {
    id: 8,
    question: "Which is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3,
    explanation: "The Pacific Ocean is the largest and deepest ocean on Earth, covering more than 60 million square miles (155 million square kilometers)."
  },
  {
    id: 9,
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctAnswer: 2,
    explanation: "Canberra is the capital city of Australia. While Sydney and Melbourne are larger cities, Canberra was specifically designed and built to serve as the nation's capital."
  },
  {
    id: 10,
    question: "Which gas do humans exhale more of compared to inhaled air?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctAnswer: 2,
    explanation: "Humans exhale more carbon dioxide than they inhale. During cellular respiration, oxygen is used to break down glucose, producing carbon dioxide as a byproduct."
  },
];

function App() {
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const handleOnboardingSubmit = useCallback((data: StudentData) => {
    setStudentData(data);
    setAppState("ready");
  }, []);

  const handleStartQuiz = useCallback(async () => {
    setAppState("loading");
    // todo: remove mock functionality - replace with actual API call to get questions
    await new Promise(resolve => setTimeout(resolve, 1500));
    setQuestions(mockQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAppState("quiz");
  }, []);

  const handleAnswer = useCallback((selectedOption: number, isCorrect: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
    }]);
  }, [questions, currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState("results");
    }
  }, [currentQuestionIndex, questions.length]);

  const handleRetakeQuiz = useCallback(async () => {
    setAppState("loading");
    // todo: remove mock functionality - in real app, fetch new questions from API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setQuestions([...mockQuestions].sort(() => Math.random() - 0.5));
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAppState("quiz");
  }, []);

  const score = answers.filter(a => a.isCorrect).length;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {appState !== "onboarding" && (
            <AppHeader studentName={studentData?.name} />
          )}

          {appState === "onboarding" && (
            <StudentOnboardingForm onSubmit={handleOnboardingSubmit} />
          )}

          {appState === "ready" && (
            <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
              <Card className="w-full max-w-md text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-semibold mb-2">Ready to Test Your Knowledge?</h1>
                  <p className="text-muted-foreground mb-6">
                    You'll be presented with 10 multiple choice questions. After each answer, you'll see whether you got it right along with an explanation.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={handleStartQuiz}
                    data-testid="button-start-quiz"
                  >
                    Start Quiz
                  </Button>
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
                    Generating questions just for you...
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
            />
          )}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
