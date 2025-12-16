import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Award, BookOpen, RefreshCw, BookMarked, Quote } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", language: "English" },
  { text: "The only way to do great work is to love what you do.", language: "English" },
  { text: "Education is the most powerful weapon which you can use to change the world.", language: "English" },
  { text: "Every expert was once a beginner.", language: "English" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", language: "English" },
  { text: "कोशिश करने वालों की कभी हार नहीं होती।", language: "Hindi" },
  { text: "मेहनत इतनी खामोशी से करो कि सफलता शोर मचा दे।", language: "Hindi" },
  { text: "शिक्षा सबसे शक्तिशाली हथियार है जिससे आप दुनिया बदल सकते हैं।", language: "Hindi" },
  { text: "हर विशेषज्ञ कभी एक शुरुआती था।", language: "Hindi" },
  { text: "सपने वो नहीं जो सोते हुए आएं, सपने वो हैं जो सोने न दें।", language: "Hindi" },
  { text: "गिरकर सीखना, संभलकर चलना, यही है जीवन का सार।", language: "Hindi" },
  { text: "Believe you can and you're halfway there.", language: "English" },
];

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

  const [randomQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  });

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

          <div className="w-full bg-muted rounded-full h-3 mb-6 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                score > 8 ? "bg-yellow-500" : score > 6 ? "bg-blue-500" : "bg-orange-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mb-8 p-4 bg-muted/50 rounded-md" data-testid="motivational-quote">
            <div className="flex items-start gap-2">
              <Quote className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm italic text-muted-foreground">
                  "{randomQuote.text}"
                </p>
              </div>
            </div>
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
