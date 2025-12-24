import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, UserPlus } from "lucide-react";
import logoImage from "@assets/Unklass_-_1_1765392666171.png";

const loginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

const navodayaStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  examGrade: z.enum(["6th", "9th"], { required_error: "Please select exam grade" }),
  medium: z.enum(["Hindi", "English"], { required_error: "Please select your medium" }),
  location: z.string().min(2, "Location must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

export type NavodayaStudentData = z.infer<typeof navodayaStudentSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface NavodayaOnboardingFormProps {
  onSubmit: (data: NavodayaStudentData) => void;
  onLogin: (data: LoginData) => Promise<boolean>;
  onBack: () => void;
}

export default function NavodayaOnboardingForm({ onSubmit, onLogin, onBack }: NavodayaOnboardingFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobile: "",
    },
  });

  const form = useForm<NavodayaStudentData>({
    resolver: zodResolver(navodayaStudentSchema),
    defaultValues: {
      name: "",
      examGrade: undefined,
      medium: undefined,
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
                data-testid="img-navodaya-logo"
              />
              <p className="text-sm text-muted-foreground" data-testid="text-navodaya-tagline">
                Learning Beyond Classroom
              </p>
            </div>
            <CardDescription className="text-base">
              Enter your details to continue practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm} key="navodaya-login-form">
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
                          data-testid="input-navodaya-name"
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
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 10-digit contact number" 
                          type="tel"
                          maxLength={10}
                          data-testid="input-navodaya-mobile"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p className="text-sm text-destructive" data-testid="text-navodaya-login-error">{loginError}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-gradient-to-r from-sky-500 to-sky-600" 
                  data-testid="button-navodaya-continue"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">New to Navodaya Prep?</p>
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
                    data-testid="button-navodaya-new-student"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register for Navodaya Prep
                  </Button>
                </div>

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-10 dark:invert" 
              data-testid="img-navodaya-logo"
            />
            <p className="text-sm text-muted-foreground" data-testid="text-navodaya-tagline">
              Learning Beyond Classroom
            </p>
          </div>
          <CardDescription className="text-base">
            Register to start your JNV entrance exam preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form} key="navodaya-registration-form">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        data-testid="input-navodaya-reg-name"
                        {...field} 
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-navodaya-medium">
                          <SelectValue placeholder="Select your preferred medium" />
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
                        data-testid="input-navodaya-location"
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
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 10-digit contact number" 
                        type="tel"
                        maxLength={10}
                        data-testid="input-navodaya-reg-mobile"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-sky-500 to-sky-600" 
                data-testid="button-navodaya-submit"
              >
                Start Navodaya Preparation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Already registered?</p>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsNewStudent(false)}
                  data-testid="button-navodaya-existing-student"
                >
                  Login with Contact Number
                </Button>
              </div>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-navodaya-back-reg"
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
