import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Library, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const CHAPTER_PRACTICE_SUBJECTS = ["Mathematics", "Science", "SST", "Hindi", "English"];

const CHAPTER_COLORS = [
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-lime-100 text-lime-800 border-lime-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
];

const optionsSchema = z.object({
  grade: z.string().min(1, "Please select your grade"),
  board: z.string().min(1, "Please select your board"),
  medium: z.string().min(1, "Please select your medium"),
  subject: z.string().min(1, "Please select a subject"),
  chapter: z.string().min(1, "Please select a chapter"),
});

export type ChapterPracticeOptionsData = z.infer<typeof optionsSchema>;

interface ChapterPracticeOptionsProps {
  studentId: number;
  studentName: string;
  savedSelections?: { grade?: string; board?: string; medium?: string; subject?: string; chapter?: string } | null;
  onSubmit: (data: ChapterPracticeOptionsData) => Promise<void>;
  onSaveSelections: (selections: Partial<ChapterPracticeOptionsData>) => void;
  onBack: () => void;
  onViewHistory?: () => void;
}

export default function ChapterPracticeOptions({ 
  studentId, 
  studentName, 
  savedSelections, 
  onSubmit, 
  onSaveSelections,
  onBack,
  onViewHistory
}: ChapterPracticeOptionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFirstRender = useRef(true);

  const form = useForm<ChapterPracticeOptionsData>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      grade: savedSelections?.grade || "",
      board: savedSelections?.board || "",
      medium: savedSelections?.medium || "English",
      subject: savedSelections?.subject || "",
      chapter: savedSelections?.chapter || "",
    },
  });

  const selectedGrade = form.watch("grade");
  const selectedBoard = form.watch("board");
  const selectedSubject = form.watch("subject");

  const { data: chapters, isLoading: chaptersLoading } = useQuery<{ chapters: string[] }>({
    queryKey: ["/api/chapter-practice/available-chapters", selectedGrade, selectedBoard, selectedSubject],
    enabled: !!selectedGrade && !!selectedBoard && !!selectedSubject,
  });

  const { data: availableSubjects } = useQuery<{ subjects: string[] }>({
    queryKey: ["/api/chapter-practice/available-subjects", selectedGrade, selectedBoard],
    enabled: !!selectedGrade && !!selectedBoard,
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    form.setValue("chapter", "");
  }, [selectedSubject]);

  const handleSubmit = async (data: ChapterPracticeOptionsData) => {
    setIsSubmitting(true);
    try {
      onSaveSelections({ grade: data.grade, board: data.board, medium: data.medium, subject: data.subject, chapter: data.chapter });
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
              data-testid="img-chapter-logo"
            />
            <p className="text-sm text-muted-foreground">
              Learning Beyond Classroom
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            <span className="font-semibold">Chapter Practice - NCERT</span>
          </div>
          {onViewHistory && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewHistory}
              className="mx-auto"
              data-testid="button-chapter-view-history"
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          )}
          <CardDescription className="text-base">
            Welcome, {studentName}! Select your practice details
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
                        <SelectTrigger data-testid="select-chapter-grade">
                          <SelectValue placeholder="Select your grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6th">6th Grade</SelectItem>
                        <SelectItem value="7th">7th Grade</SelectItem>
                        <SelectItem value="8th">8th Grade</SelectItem>
                        <SelectItem value="9th">9th Grade</SelectItem>
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
                        <SelectTrigger data-testid="select-chapter-board">
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
                        <SelectTrigger data-testid="select-chapter-medium">
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
                        <SelectTrigger data-testid="select-chapter-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHAPTER_PRACTICE_SUBJECTS.map((subject) => {
                          const isAvailable = !availableSubjects?.subjects || availableSubjects.subjects.includes(subject);
                          return (
                            <SelectItem 
                              key={subject} 
                              value={subject}
                              disabled={!isAvailable}
                              className={!isAvailable ? "opacity-50" : ""}
                            >
                              {subject}{!isAvailable ? " (Not Available)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedGrade && selectedBoard && selectedSubject && (
                <FormField
                  control={form.control}
                  name="chapter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chapter-chapter">
                            <SelectValue placeholder={chaptersLoading ? "Loading chapters..." : "Select a chapter"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chapters?.chapters?.map((chapter, index) => (
                            <SelectItem 
                              key={chapter} 
                              value={chapter}
                              className={`${CHAPTER_COLORS[index % CHAPTER_COLORS.length]} my-1 rounded`}
                            >
                              {index + 1}. {chapter}
                            </SelectItem>
                          ))}
                          {!chaptersLoading && (!chapters?.chapters || chapters.chapters.length === 0) && (
                            <SelectItem value="_none" disabled>No chapters available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isSubmitting}
                data-testid="button-chapter-start"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Start Practice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-chapter-back"
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
