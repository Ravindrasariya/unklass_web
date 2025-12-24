import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, UserPlus, ArrowLeft } from "lucide-react";
import logoImage from "@assets/Unklass_-_1_1765392666171.png";

const loginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  grade: z.string().min(1, "Please select your grade"),
  board: z.string().min(1, "Please select your board"),
  medium: z.string().min(1, "Please select your medium"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

export type StudentData = z.infer<typeof studentSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface StudentOnboardingFormProps {
  onSubmit: (data: StudentData) => void;
  onLogin: (data: LoginData) => Promise<boolean>;
  onBack: () => void;
}

export default function StudentOnboardingForm({ onSubmit, onLogin, onBack }: StudentOnboardingFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobile: "",
    },
  });

  const form = useForm<StudentData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      grade: "",
      board: "",
      medium: "",
      location: "",
      mobile: "",
    },
  });

  const handleLogin = async (data: LoginData) => {
    setLoginError(null);
    const found = await onLogin(data);
    if (!found) {
      setLoginError("Student not found. Please register as a new student.");
    }
  };

  // Login form for returning students
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
                data-testid="img-logo"
              />
              <p className="text-sm text-muted-foreground" data-testid="text-tagline">
                Learning Beyond Classroom
              </p>
            </div>
            <CardDescription className="text-base">
              Enter your details to continue learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm} key="login-form">
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
                          data-testid="input-name"
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
                          data-testid="input-mobile"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p className="text-sm text-destructive" data-testid="text-login-error">{loginError}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  data-testid="button-continue"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">New student?</p>
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Transfer login form values to registration form
                      const loginValues = loginForm.getValues();
                      form.setValue("name", loginValues.name);
                      form.setValue("mobile", loginValues.mobile);
                      setIsNewStudent(true);
                    }}
                    data-testid="button-new-student"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register as New Student
                  </Button>
                </div>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onBack}
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full registration form for new students
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-10 dark:invert" 
              data-testid="img-logo"
            />
            <p className="text-sm text-muted-foreground" data-testid="text-tagline">
              Learning Beyond Classroom
            </p>
          </div>
          <CardDescription className="text-base">
            Let's get to know you before we start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form} key="registration-form">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        data-testid="input-name"
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
                        <SelectTrigger data-testid="select-grade">
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your city/town" 
                        data-testid="input-location"
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
                        data-testid="input-mobile"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6" 
                data-testid="button-submit-onboarding"
              >
                Start Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Already registered?</p>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsNewStudent(false)}
                  data-testid="button-existing-student"
                >
                  Login with Mobile Number
                </Button>
              </div>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-back-home-reg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
