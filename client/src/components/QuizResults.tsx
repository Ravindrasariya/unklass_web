import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, BookOpen, RefreshCw, BookMarked } from "lucide-react";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onRetakeQuiz: () => void;
  onTryAnotherSubject: () => void;
}

export default function QuizResults({ 
  score, 
  totalQuestions, 
  onRetakeQuiz,
  onTryAnotherSubject,
}: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);

  const getPerformanceData = () => {
    if (score > 8) {
      return {
        icon: Trophy,
        message: "Excellent!",
        description: "Outstanding performance! You've mastered this topic.",
        color: "text-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    }
    if (score > 6) {
      return {
        icon: Award,
        message: "Good Job!",
        description: "Well done! You have a solid understanding of this topic.",
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      };
    }
    return {
      icon: BookOpen,
      message: "Keep Learning!",
      description: "Don't give up! Review the material and try again.",
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    };
  };

  const performance = getPerformanceData();
  const Icon = performance.icon;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full ${performance.bgColor} flex items-center justify-center mb-6`}>
            <Icon className={`w-10 h-10 ${performance.color}`} />
          </div>

          <h1 className="text-3xl font-bold mb-2" data-testid="text-performance-message">
            {performance.message}
          </h1>
          <p className="text-muted-foreground mb-8">
            {performance.description}
          </p>

          <div className="mb-8">
            <div className="text-6xl font-bold mb-2" data-testid="text-score">
              {score}<span className="text-3xl text-muted-foreground">/{totalQuestions}</span>
            </div>
            <p className="text-lg text-muted-foreground">
              {percentage}% Correct
            </p>
          </div>

          <div className="w-full bg-muted rounded-full h-3 mb-8 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                score > 8 ? "bg-yellow-500" : score > 6 ? "bg-blue-500" : "bg-orange-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={onRetakeQuiz}
              data-testid="button-retake-quiz"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another Test
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={onTryAnotherSubject}
              data-testid="button-another-subject"
            >
              <BookMarked className="w-4 h-4 mr-2" />
              Choose Different Subject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
