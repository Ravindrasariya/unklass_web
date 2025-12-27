import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { MathText } from "@/components/MathText";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizQuestionProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
  onAnswer: (selectedOption: number, isCorrect: boolean) => void;
  onNext: () => void;
  onPrevious?: () => void;
  canGoPrevious?: boolean;
  previousAnswer?: { selectedOption: number; isCorrect: boolean } | null;
}

export default function QuizQuestion({
  question,
  currentQuestion,
  totalQuestions,
  onAnswer,
  onNext,
  onPrevious,
  canGoPrevious = false,
  previousAnswer = null,
}: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(
    previousAnswer?.selectedOption ?? null
  );
  const [hasSubmitted, setHasSubmitted] = useState(previousAnswer !== null);

  useEffect(() => {
    if (previousAnswer) {
      setSelectedOption(previousAnswer.selectedOption);
      setHasSubmitted(true);
    } else {
      setSelectedOption(null);
      setHasSubmitted(false);
    }
  }, [question.id, previousAnswer]);

  const handleOptionSelect = (index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  };

  const handlePrevious = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    onPrevious?.();
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setHasSubmitted(true);
    const isCorrect = selectedOption === question.correctAnswer;
    onAnswer(selectedOption, isCorrect);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    onNext();
  };

  const getOptionStyles = (index: number) => {
    if (!hasSubmitted) {
      return selectedOption === index
        ? "border-primary bg-primary/5"
        : "border-border hover:border-primary/50";
    }

    if (index === question.correctAnswer) {
      return "border-green-500 bg-green-50 dark:bg-green-950/30";
    }
    if (index === selectedOption && index !== question.correctAnswer) {
      return "border-red-500 bg-red-50 dark:bg-red-950/30";
    }
    return "border-border opacity-50";
  };

  const progress = ((currentQuestion) / totalQuestions) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" data-testid="text-question-progress">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-medium mb-6" data-testid="text-question">
              <MathText text={question.question} />
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={hasSubmitted}
                  className={`
                    w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                    flex items-center gap-4
                    ${getOptionStyles(index)}
                    ${!hasSubmitted ? "cursor-pointer hover-elevate" : "cursor-default"}
                  `}
                  data-testid={`button-option-${index}`}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1"><MathText text={option} /></span>
                  {hasSubmitted && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {hasSubmitted && index === selectedOption && index !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </button>
              ))}
            </div>

            {hasSubmitted && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg" data-testid="panel-explanation">
                <div className="flex items-center gap-2 mb-2">
                  {selectedOption === question.correctAnswer ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-700 dark:text-red-400">Incorrect</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Correct Answer:</strong> {String.fromCharCode(65 + question.correctAnswer)}. <MathText text={question.options[question.correctAnswer]} />
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Explanation:</strong> <MathText text={question.explanation} />
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between gap-4">
              <div>
                {canGoPrevious && onPrevious && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    data-testid="button-previous-question"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              <div>
                {!hasSubmitted ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    data-testid="button-submit-answer"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNext} data-testid="button-next-question">
                    {currentQuestion === totalQuestions ? "See Results" : "Next Question"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
