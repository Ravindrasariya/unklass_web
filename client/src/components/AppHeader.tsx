import { User } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

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
          <img 
            src={logoImage} 
            alt="Unklass" 
            className="h-8 dark:invert" 
            data-testid="img-logo"
          />
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
