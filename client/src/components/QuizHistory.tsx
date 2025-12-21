import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, BookOpen } from "lucide-react";
import { type Question } from "./QuizQuestion";

interface QuizSession {
  id: number;
  subject?: string;
  grade?: string;
  board?: string;
  year?: string;
  medium?: string;
  examGrade?: string;
  score: number | null;
  totalQuestions: number;
  completedAt: string | null;
}

interface QuizAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

interface QuizReview {
  id: number;
  subject?: string;
  grade?: string;
  board?: string;
  year?: string;
  medium?: string;
  examGrade?: string;
  score: number;
  totalQuestions: number;
  questions: Question[];
  answers: QuizAnswer[];
  completedAt: string;
}

interface QuizHistoryProps {
  studentId: number;
  onBack: () => void;
  isCpct?: boolean;
  isNavodaya?: boolean;
}

function formatChemicalFormulas(text: string): string {
  return text
    .replace(/(\d+)/g, (match) => {
      const subscripts = "₀₁₂₃₄₅₆₇₈₉";
      return match.split("").map(d => subscripts[parseInt(d)]).join("");
    })
    .replace(/\^(\+|\-)/g, (_, sign) => sign === "+" ? "⁺" : "⁻");
}

export default function QuizHistory({ studentId, onBack, isCpct = false, isNavodaya = false }: QuizHistoryProps) {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuizReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    let endpoint: string;
    if (isNavodaya) {
      endpoint = `/api/navodaya/students/${studentId}/quiz-history`;
    } else if (isCpct) {
      endpoint = `/api/cpct/students/${studentId}/quiz-history`;
    } else {
      endpoint = `/api/students/${studentId}/quiz-history`;
    }
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch quiz history:", err);
        setLoading(false);
      });
  }, [studentId, isCpct, isNavodaya]);

  const handleReview = async (sessionId: number) => {
    setReviewLoading(true);
    try {
      let endpoint: string;
      if (isNavodaya) {
        endpoint = `/api/navodaya/quiz/${sessionId}/review`;
      } else if (isCpct) {
        endpoint = `/api/cpct/quiz/${sessionId}/review`;
      } else {
        endpoint = `/api/quiz/${sessionId}/review`;
      }
      const res = await fetch(endpoint);
      const data = await res.json();
      setSelectedSession(data);
    } catch (err) {
      console.error("Failed to fetch quiz review:", err);
    }
    setReviewLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading quiz history...</p>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] p-4">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedSession(null)}
            className="mb-4"
            data-testid="button-back-to-history"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-xl">
                  {isNavodaya 
                    ? `Navodaya ${selectedSession.examGrade} - Review`
                    : isCpct 
                      ? `CPCT ${selectedSession.year} - Review`
                      : `${selectedSession.subject} - Review`
                  }
                </CardTitle>
                <Badge variant={selectedSession.score >= 7 ? "default" : "secondary"}>
                  Score: {selectedSession.score}/{selectedSession.totalQuestions}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNavodaya
                  ? `Grade: ${selectedSession.examGrade} | Medium: ${selectedSession.medium} | Completed: ${new Date(selectedSession.completedAt).toLocaleDateString()}`
                  : isCpct 
                    ? `Medium: ${selectedSession.medium} | Completed: ${new Date(selectedSession.completedAt).toLocaleDateString()}`
                    : `${selectedSession.grade} | ${selectedSession.board} | Completed: ${new Date(selectedSession.completedAt).toLocaleDateString()}`
                }
              </p>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {selectedSession.questions?.map((question, index) => {
              const answer = selectedSession.answers?.find(a => a.questionId === question.id);
              const isCorrect = answer?.isCorrect ?? false;
              
              return (
                <Card 
                  key={question.id} 
                  className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
                  data-testid={`card-question-review-${question.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Question {index + 1}
                        </p>
                        <p className="text-base">{formatChemicalFormulas(question.question)}</p>
                      </div>
                    </div>

                    <div className="ml-8 space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isSelected = answer?.selectedOption === optIndex;
                        const isCorrectOption = optIndex === question.correctAnswer;
                        
                        let optionClass = "p-3 rounded-md border text-sm";
                        if (isCorrectOption) {
                          optionClass += " bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700";
                        } else if (isSelected && !isCorrect) {
                          optionClass += " bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700";
                        } else {
                          optionClass += " bg-muted/30 border-transparent";
                        }
                        
                        return (
                          <div key={optIndex} className={optionClass}>
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {formatChemicalFormulas(option)}
                            {isCorrectOption && (
                              <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                                Correct
                              </Badge>
                            )}
                            {isSelected && !isCorrect && (
                              <Badge variant="outline" className="ml-2 text-red-600 border-red-300">
                                Your Answer
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="ml-8 mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {formatChemicalFormulas(question.explanation)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
          data-testid="button-back-to-subjects"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isNavodaya ? "Back to Navodaya" : isCpct ? "Back to CPCT" : "Back to Subjects"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {isNavodaya ? "Navodaya Quiz History" : isCpct ? "CPCT Quiz History" : "Quiz History"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review your past quizzes to revise questions
            </p>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No quiz history yet.</p>
                <p className="text-sm">Take a quiz to see your history here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between gap-4 p-4 border rounded-lg hover-elevate"
                    data-testid={`card-quiz-session-${session.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {isNavodaya 
                          ? `Navodaya ${session.examGrade}` 
                          : isCpct 
                            ? `CPCT ${session.year}` 
                            : session.subject}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isNavodaya
                          ? `Medium: ${session.medium}`
                          : isCpct 
                            ? `Medium: ${session.medium}`
                            : `${session.grade} | ${session.board}`
                        }
                        {session.completedAt && (
                          <span> | {new Date(session.completedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.score !== null && (
                        <Badge variant={session.score >= 7 ? "default" : "secondary"}>
                          {session.score}/{session.totalQuestions}
                        </Badge>
                      )}
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(session.id)}
                        disabled={reviewLoading || session.score === null}
                        data-testid={`button-review-${session.id}`}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
