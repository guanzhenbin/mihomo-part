"use client";

import { useState, type FC, type FormEvent, type JSX } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/label";
import { Mail, Lock, LogIn } from "lucide-react"; // Correct import for LogIn icon

interface LoginFormProps {
  // Callback for when the login form is submitted
  onLoginSubmit?: (email: string, password: string) => void;
  // Callback for "Forgot password" action
  onForgotPassword?: () => void;
  // Callback for "Create account" action
  onCreateAccount?: () => void;
}

const LoginForm: FC<LoginFormProps> = ({
  onLoginSubmit,
  onForgotPassword,
  onCreateAccount,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    if (error) setError(""); // Clear error when user starts typing
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);
    if (error) setError(""); // Clear error when user starts typing
  };

  const validateEmail = (emailToValidate: string): boolean => {
    // Basic email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);
  };

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setError(""); // Clear previous errors

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // If an onLoginSubmit callback is provided, use it
    if (onLoginSubmit) {
      onLoginSubmit(email, password);
    } else {
      // Placeholder login logic if no callback is provided
      console.log("Login attempt with:", { email, password });
      // Simulate a successful login for placeholder
      alert("Login submitted! (Placeholder - implement actual login logic)");
    }
  };

  const handleForgotPasswordClick = (): void => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      console.log("Forgot password clicked (Placeholder)");
      alert("Forgot password functionality not implemented yet.");
    }
  };

  const handleCreateAccountClick = (): void => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      console.log("Create account clicked (Placeholder)");
      alert("Create account functionality not implemented yet.");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
            <LogIn className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10" // Padding to make space for the icon
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleForgotPasswordClick}
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10" // Padding to make space for the icon
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 text-left">{error}</p>
          )}
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 pt-4">
        <div className="flex w-full items-center">
          <div className="flex-grow border-t border-muted" />
          <span className="mx-2 text-xs text-muted-foreground">
            Or continue with
          </span>
          <div className="flex-grow border-t border-muted" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleCreateAccountClick}
        >
          Create Account
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Page Component
export default function LoginPage(): JSX.Element {
  const handleLogin = (email: string, password: string): void => {
    // Implement your actual login logic here
    // For example, call an API, update auth state, etc.
    console.log("LoginPage: Attempting login with", email, password);
    alert(`LoginPage: Login attempt with ${email}. Check console.`);
    // On successful login, you would typically redirect the user
    // e.g., router.push('/dashboard');
  };

  const handleForgotPassword = (): void => {
    console.log("LoginPage: Forgot password requested");
    // Navigate to forgot password page or show a modal
  };

  const handleCreateAccount = (): void => {
    console.log("LoginPage: Create account requested");
    // Navigate to sign-up page or show a modal
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <LoginForm 
        onLoginSubmit={handleLogin}
        onForgotPassword={handleForgotPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
} 