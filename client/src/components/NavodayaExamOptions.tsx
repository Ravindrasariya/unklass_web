import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, School, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const NAVODAYA_SECTIONS_6TH = [
  "Mental Ability Test",
  "Arithmetic Test",
  "Language Test",
];

const NAVODAYA_SECTIONS_9TH = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
];

const optionsSchema = z.object({
  medium: z.string().min(1, "Please select your medium"),
  examGrade: z.string().min(1, "Please select your exam grade"),
  section: z.string().min(1, "Please select a section"),
});

export type NavodayaExamOptionsData = z.infer<typeof optionsSchema>;

interface NavodayaExamOptionsProps {
  studentId: number;
  studentName: string;
  savedSelections?: { medium?: string; examGrade?: string; section?: string } | null;
  onSubmit: (data: NavodayaExamOptionsData) => Promise<void>;
  onSaveSelections: (selections: Partial<NavodayaExamOptionsData>) => void;
  onBack: () => void;
  onViewHistory?: () => void;
}

export default function NavodayaExamOptions({ 
  studentId, 
  studentName, 
  savedSelections, 
  onSubmit, 
  onSaveSelections,
  onBack,
  onViewHistory
}: NavodayaExamOptionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate saved section matches saved grade
  const getValidatedSection = () => {
    if (!savedSelections?.section || !savedSelections?.examGrade) return "";
    const validSections = savedSelections.examGrade === "6th" ? NAVODAYA_SECTIONS_6TH : NAVODAYA_SECTIONS_9TH;
    return validSections.includes(savedSelections.section) ? savedSelections.section : "";
  };

  const form = useForm<NavodayaExamOptionsData>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      medium: savedSelections?.medium || "",
      examGrade: savedSelections?.examGrade || "",
      section: getValidatedSection(),
    },
  });

  const selectedExamGrade = form.watch("examGrade");
  const sections = selectedExamGrade === "6th" ? NAVODAYA_SECTIONS_6TH : NAVODAYA_SECTIONS_9TH;

  const { data: availableSections } = useQuery<{ sections: string[]; grade: string }>({
    queryKey: ["/api/navodaya/available-sections", selectedExamGrade],
    enabled: !!selectedExamGrade,
  });

  const handleSubmit = async (data: NavodayaExamOptionsData) => {
    setIsSubmitting(true);
    try {
      onSaveSelections({ medium: data.medium, examGrade: data.examGrade, section: data.section });
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-12 dark:invert" 
              data-testid="img-navodaya-logo"
            />
            <p className="text-sm text-muted-foreground">
              Learning Beyond Classroom
            </p>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <School className="w-5 h-5 text-primary" />
            Navodaya Exam Prep
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Welcome, {studentName}!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-navodaya-medium">
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
                name="examGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Grade</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("section", "");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-navodaya-exam-grade">
                          <SelectValue placeholder="Select exam grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6th">6th Grade (Class VI Entry)</SelectItem>
                        <SelectItem value="9th">9th Grade (Class IX Entry)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedExamGrade && (
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-navodaya-section">
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => {
                            const isAvailable = !availableSections?.sections || availableSections.sections.includes(section);
                            return (
                              <SelectItem 
                                key={section} 
                                value={section}
                                disabled={!isAvailable}
                                className={!isAvailable ? "opacity-50" : ""}
                              >
                                {section}{!isAvailable ? " (Not Available)" : ""}
                              </SelectItem>
                            );
                          })}
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
                data-testid="button-navodaya-start"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Start Quiz
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {onViewHistory && (
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onViewHistory}
                  data-testid="button-navodaya-history"
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              )}

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-navodaya-back"
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
