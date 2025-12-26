import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const optionsSchema = z.object({
  grade: z.string().min(1, "Please select your grade"),
  board: z.string().min(1, "Please select your board"),
  medium: z.string().min(1, "Please select your medium"),
  subject: z.string().min(1, "Please select a subject"),
});

export type BoardExamOptionsData = z.infer<typeof optionsSchema>;

interface BoardExamOptionsProps {
  studentId: number;
  studentName: string;
  savedSelections?: { grade?: string; board?: string; medium?: string } | null;
  onSubmit: (data: BoardExamOptionsData) => Promise<void>;
  onSaveSelections: (selections: Partial<BoardExamOptionsData>) => void;
  onBack: () => void;
}

const SUBJECTS = ["Mathematics", "Science", "SST", "Hindi", "English", "Physics", "Chemistry", "Biology"];

export default function BoardExamOptions({ 
  studentId, 
  studentName, 
  savedSelections, 
  onSubmit, 
  onSaveSelections,
  onBack 
}: BoardExamOptionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BoardExamOptionsData>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      grade: savedSelections?.grade || "",
      board: savedSelections?.board || "",
      medium: savedSelections?.medium || "English",
      subject: "",
    },
  });

  const selectedGrade = form.watch("grade");
  const selectedBoard = form.watch("board");

  const { data: availableSubjects } = useQuery<{ subjects: string[] }>({
    queryKey: ["/api/available-subjects", selectedGrade, selectedBoard],
    enabled: !!selectedGrade && !!selectedBoard,
  });

  const handleSubmit = async (data: BoardExamOptionsData) => {
    setIsSubmitting(true);
    try {
      onSaveSelections({ grade: data.grade, board: data.board, medium: data.medium });
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-10 dark:invert" 
              data-testid="img-board-logo"
            />
            <p className="text-sm text-muted-foreground">
              Learning Beyond Classroom
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold">Board Exam Prep</span>
          </div>
          <CardDescription className="text-base">
            Welcome, {studentName}! Select your exam details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-board-grade">
                          <SelectValue placeholder="Select your grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="8th">8th Grade</SelectItem>
                        <SelectItem value="10th">10th Grade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="board"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Board</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-board-board">
                          <SelectValue placeholder="Select your board" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MP">MP Board</SelectItem>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-board-medium">
                          <SelectValue placeholder="Select your medium" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-board-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(availableSubjects?.subjects || SUBJECTS).map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isSubmitting}
                data-testid="button-board-start"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Start Quiz
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-board-back"
              >
                Back to Home
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
