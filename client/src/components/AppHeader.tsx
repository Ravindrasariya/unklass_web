import { GraduationCap, User } from "lucide-react";

interface AppHeaderProps {
  studentName?: string;
  showProgress?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
}

export default function AppHeader({ 
  studentName,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">QuizGenius</span>
        </div>

        {studentName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid="text-student-name">{studentName}</span>
          </div>
        )}
      </div>
    </header>
  );
}
