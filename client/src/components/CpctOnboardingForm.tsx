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

const cpctStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  medium: z.enum(["Hindi", "English"], { required_error: "Please select your medium" }),
  location: z.string().min(2, "Location must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

export type CpctStudentData = z.infer<typeof cpctStudentSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface CpctOnboardingFormProps {
  onSubmit: (data: CpctStudentData) => void;
  onLogin: (data: LoginData) => Promise<boolean>;
  onBack: () => void;
}

export default function CpctOnboardingForm({ onSubmit, onLogin, onBack }: CpctOnboardingFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobile: "",
    },
  });

  const form = useForm<CpctStudentData>({
    resolver: zodResolver(cpctStudentSchema),
    defaultValues: {
      name: "",
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

  // Login form for returning CPCT students
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
                data-testid="img-cpct-logo"
              />
              <p className="text-sm text-muted-foreground" data-testid="text-cpct-tagline">
                Learning Beyond Classroom
              </p>
            </div>
            <CardDescription className="text-base">
              Enter your details to continue practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm} key="cpct-login-form">
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
                          data-testid="input-cpct-name"
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
                          data-testid="input-cpct-mobile"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p className="text-sm text-destructive" data-testid="text-cpct-login-error">{loginError}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  data-testid="button-cpct-continue"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">New to CPCT Prep?</p>
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
                    data-testid="button-cpct-new-student"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register for CPCT Prep
                  </Button>
                </div>

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

  // Full registration form for new CPCT students
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-10 dark:invert" 
              data-testid="img-cpct-logo"
            />
            <p className="text-sm text-muted-foreground" data-testid="text-cpct-tagline">
              Learning Beyond Classroom
            </p>
          </div>
          <CardDescription className="text-base">
            Register to start your CPCT exam preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form} key="cpct-registration-form">
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
                        data-testid="input-cpct-reg-name"
                        {...field} 
                      />
                    </FormControl>
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
                        <SelectTrigger data-testid="select-cpct-medium">
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
                        data-testid="input-cpct-location"
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
                        data-testid="input-cpct-reg-mobile"
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
                data-testid="button-cpct-submit"
              >
                Start CPCT Preparation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Already registered?</p>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsNewStudent(false)}
                  data-testid="button-cpct-existing-student"
                >
                  Login with Mobile Number
                </Button>
              </div>

              <Button 
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                data-testid="button-cpct-back-reg"
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
