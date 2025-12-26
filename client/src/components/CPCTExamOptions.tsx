import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Monitor, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const CPCT_SECTIONS = [
  "MS Office",
  "Software Operating System & IT Fundamentals",
  "Internet, Networking & Security",
  "Hardware Peripheral & Devices",
  "Aptitude & Logical Reasoning",
];

const optionsSchema = z.object({
  medium: z.string().min(1, "Please select your medium"),
  section: z.string().min(1, "Please select a section"),
});

export type CPCTExamOptionsData = z.infer<typeof optionsSchema>;

interface CPCTExamOptionsProps {
  studentId: number;
  studentName: string;
  savedSelections?: { medium?: string; section?: string } | null;
  onSubmit: (data: CPCTExamOptionsData) => Promise<void>;
  onSaveSelections: (selections: Partial<CPCTExamOptionsData>) => void;
  onBack: () => void;
  onViewHistory?: () => void;
}

export default function CPCTExamOptions({ 
  studentId, 
  studentName, 
  savedSelections, 
  onSubmit, 
  onSaveSelections,
  onBack,
  onViewHistory
}: CPCTExamOptionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CPCTExamOptionsData>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      medium: savedSelections?.medium || "",
      section: savedSelections?.section || "",
    },
  });

  const { data: availableSections } = useQuery<{ sections: string[] }>({
    queryKey: ["/api/cpct/available-sections"],
  });

  const handleSubmit = async (data: CPCTExamOptionsData) => {
    setIsSubmitting(true);
    try {
      onSaveSelections({ medium: data.medium, section: data.section });
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
              data-testid="img-cpct-logo"
            />
            <p className="text-sm text-muted-foreground">
              Learning Beyond Classroom
            </p>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            CPCT Exam Prep
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
                        <SelectTrigger data-testid="select-cpct-medium">
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
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cpct-section">
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CPCT_SECTIONS.map((section) => {
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

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isSubmitting}
                data-testid="button-cpct-start"
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
                  data-testid="button-cpct-history"
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
                data-testid="button-cpct-back"
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
