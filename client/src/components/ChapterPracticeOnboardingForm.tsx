import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Library } from "lucide-react";
import logoIcon from "@assets/Unklass_-_1_1765392666171.png";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  grade: z.string().min(1, "Please select your grade"),
  board: z.string().min(1, "Please select your board"),
  medium: z.string().min(1, "Please select your medium"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

export type ChapterPracticeStudentData = z.infer<typeof formSchema>;

interface ChapterPracticeOnboardingFormProps {
  onSubmit: (data: ChapterPracticeStudentData) => Promise<void>;
  onLogin: (data: { name: string; mobile: string }) => Promise<boolean>;
  onBack: () => void;
}

export default function ChapterPracticeOnboardingForm({ onSubmit, onLogin, onBack }: ChapterPracticeOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturningStudent, setIsReturningStudent] = useState(false);

  const form = useForm<ChapterPracticeStudentData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      schoolName: "",
      grade: "",
      board: "",
      medium: "English",
      location: "",
      mobile: "",
    },
  });

  const loginForm = useForm<{ name: string; mobile: string }>({
    defaultValues: { name: "", mobile: "" },
  });

  const handleSubmit = async (data: ChapterPracticeStudentData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (data: { name: string; mobile: string }) => {
    setIsSubmitting(true);
    try {
      const success = await onLogin(data);
      if (!success) {
        loginForm.setError("mobile", { message: "Student not found. Please register first." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReturningStudent) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setIsReturningStudent(false)}
              data-testid="button-back-register"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4 bg-violet-50 flex items-center justify-center">
              <Library className="h-8 w-8 text-violet-600" />
            </div>
            <CardTitle className="text-xl">Welcome Back!</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your details to continue practicing
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  {...loginForm.register("name", { required: "Name is required" })}
                  placeholder="Enter your name"
                  data-testid="input-login-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  {...loginForm.register("mobile", { required: "Mobile is required" })}
                  placeholder="Enter your 10-digit mobile"
                  data-testid="input-login-mobile"
                />
                {loginForm.formState.errors.mobile && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.mobile.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isSubmitting}
                data-testid="button-login-submit"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={onBack}
            data-testid="button-back-landing"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-4 bg-violet-50 flex items-center justify-center">
            <Library className="h-8 w-8 text-violet-600" />
          </div>
          <CardTitle className="text-xl">Chapter Practice - NCERT</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Practice chapter-wise questions from NCERT textbooks
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your school name" {...field} data-testid="input-school-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-grade">
                          <SelectValue placeholder="Select your grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6th">6th</SelectItem>
                        <SelectItem value="7th">7th</SelectItem>
                        <SelectItem value="8th">8th</SelectItem>
                        <SelectItem value="9th">9th</SelectItem>
                        <SelectItem value="10th">10th</SelectItem>
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
                        <SelectTrigger data-testid="select-board">
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
                        <SelectTrigger data-testid="select-medium">
                          <SelectValue placeholder="Select your medium" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your city/village" {...field} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your 10-digit mobile" {...field} data-testid="input-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isSubmitting}
                data-testid="button-register-submit"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Start Practicing
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-violet-600 hover:underline"
              onClick={() => setIsReturningStudent(true)}
              data-testid="link-returning-student"
            >
              Already registered? Click here to continue
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
