import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, UserPlus, Loader2 } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

const loginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
  schoolName: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

interface UnifiedAuthFormProps {
  onLogin: (data: LoginData) => Promise<boolean>;
  onRegister: (data: RegisterData) => Promise<boolean>;
  onBack: () => void;
}

export default function UnifiedAuthForm({ onLogin, onRegister, onBack }: UnifiedAuthFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      mobileNumber: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      fatherName: "",
      location: "",
      mobileNumber: "",
      schoolName: "",
    },
  });

  const handleLogin = async (data: LoginData) => {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      const success = await onLogin(data);
      if (!success) {
        setLoginError("Student not found. Please check your details or register if you're new.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setRegisterError(null);
    setIsSubmitting(true);
    try {
      const success = await onRegister(data);
      if (!success) {
        setRegisterError("Registration failed. This mobile number may already be registered.");
      }
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
                data-testid="img-auth-logo"
              />
              <p className="text-sm text-muted-foreground" data-testid="text-auth-tagline">
                Learning Beyond Classroom
              </p>
            </div>
            <CardDescription className="text-base">
              Enter your details to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm} key="unified-login-form">
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
                          data-testid="input-login-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 10-digit mobile number" 
                          type="tel"
                          maxLength={10}
                          data-testid="input-login-mobile"
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
                  disabled={isSubmitting}
                  data-testid="button-login-continue"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
                      const loginValues = loginForm.getValues();
                      registerForm.setValue("name", loginValues.name);
                      registerForm.setValue("mobileNumber", loginValues.mobileNumber);
                      setIsNewStudent(true);
                    }}
                    data-testid="button-new-student"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Now
                  </Button>
                </div>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onBack}
                  data-testid="button-back-home"
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
              data-testid="img-auth-logo"
            />
            <p className="text-sm text-muted-foreground" data-testid="text-auth-tagline">
              Learning Beyond Classroom
            </p>
          </div>
          <CardDescription className="text-base">
            Register to start learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...registerForm} key="unified-register-form">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        data-testid="input-register-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your father's name" 
                        data-testid="input-register-father-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your city/town" 
                        data-testid="input-register-location"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 10-digit mobile number" 
                        type="tel"
                        maxLength={10}
                        data-testid="input-register-mobile"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your school name" 
                        data-testid="input-register-school"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {registerError && (
                <p className="text-sm text-destructive" data-testid="text-register-error">{registerError}</p>
              )}

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isSubmitting}
                data-testid="button-register-submit"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Register
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
                Back to Home
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
