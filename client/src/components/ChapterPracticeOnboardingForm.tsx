import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, UserPlus } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const loginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

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
type LoginData = z.infer<typeof loginSchema>;

interface ChapterPracticeOnboardingFormProps {
  onSubmit: (data: ChapterPracticeStudentData) => Promise<void>;
  onLogin: (data: { name: string; mobile: string }) => Promise<boolean>;
  onBack: () => void;
}

export default function ChapterPracticeOnboardingForm({ onSubmit, onLogin, onBack }: ChapterPracticeOnboardingFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobile: "",
    },
  });

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

  const handleLogin = async (data: LoginData) => {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const found = await onLogin(data);
      if (!found) {
        setLoginError("Student not found. Please register as a new student.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: ChapterPracticeStudentData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isNewStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <div className="flex flex-col items-center gap-1 mb-2">
              <img 
                src={logoImage} 
                alt="UNKLASS" 
                className="h-10 dark:invert" 
                data-testid="img-chapter-practice-logo"
              />
              <p className="text-sm text-muted-foreground" data-testid="text-chapter-practice-tagline">
                Learning Beyond Classroom
              </p>
            </div>
            <CardDescription className="text-base">
              Enter your details to continue practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm} key="chapter-practice-login-form">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          data-testid="input-chapter-practice-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 10-digit mobile number" 
                          type="tel"
                          maxLength={10}
                          data-testid="input-chapter-practice-mobile"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p className="text-sm text-destructive" data-testid="text-chapter-practice-login-error">{loginError}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-gradient-to-r from-violet-500 to-violet-600" 
                  disabled={isSubmitting}
                  data-testid="button-chapter-practice-continue"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">New to Chapter Practice?</p>
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const loginValues = loginForm.getValues();
                      form.setValue("name", loginValues.name);
                      form.setValue("mobile", loginValues.mobile);
                      setIsNewStudent(true);
                    }}
                    data-testid="button-chapter-practice-new-student"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register for Chapter Practice
                  </Button>
                </div>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onBack}
                  data-testid="button-chapter-practice-back"
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-10 dark:invert" 
              data-testid="img-chapter-practice-logo"
            />
            <p className="text-sm text-muted-foreground" data-testid="text-chapter-practice-tagline">
              Learning Beyond Classroom
            </p>
          </div>
          <CardDescription className="text-base">
            Register to start your chapter-wise practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form} key="chapter-practice-registration-form">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        data-testid="input-chapter-practice-reg-name"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Enter your school name" 
                        data-testid="input-chapter-practice-school"
                        {...field} 
                      />
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
                        <SelectTrigger data-testid="select-chapter-practice-grade">
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
                        <SelectTrigger data-testid="select-chapter-practice-board">
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
                        <SelectTrigger data-testid="select-chapter-practice-medium">
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
                      <Input 
                        placeholder="Enter your city/town" 
                        data-testid="input-chapter-practice-location"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Enter 10-digit mobile number" 
                        type="tel"
                        maxLength={10}
                        data-testid="input-chapter-practice-reg-mobile"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-violet-500 to-violet-600" 
                disabled={isSubmitting}
                data-testid="button-chapter-practice-submit"
              >
                Start Chapter Practice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Already registered?</p>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsNewStudent(false)}
                  data-testid="button-chapter-practice-existing-student"
                >
                  Login with Mobile Number
                </Button>
              </div>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-chapter-practice-back-reg"
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
