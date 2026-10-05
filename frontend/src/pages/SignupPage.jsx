import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  Navigation,
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { Separator } from "@/components/ui/separator.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { useAuth } from "../hooks/useAuth.js";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "Mech", "Civil", "Chem", "Aero", "Other"];

export function SignupPage() {
  const { signup, loginWithGoogle, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    graduation_year: "",
    cgpa: "",
  });
  const [localError, setLocalError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        branch: form.branch,
        graduation_year: form.graduation_year,
        cgpa: form.cgpa,
      });
      navigate("/dashboard");
    } catch {
      // handled by context
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch {
      // handled
    } finally {
      setGoogleLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-primary">
            <Navigation className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight">CampusPilot</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl text-center font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-center text-muted-foreground mt-1">Get started with CampusPilot in seconds.</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Alex Sharma"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="pl-9 h-9"
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="pl-9 h-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="pl-9 h-9"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="•••••••"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  className="pl-9 h-9"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground"> (Optional) helps with eligibility matching</p>

          <div className="space-y-1.5">
            <Label htmlFor="college">College</Label>
            <Input
              id="college"
              placeholder="Visvesvaraya National Institute of Technology"
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch</Label>
              <Select value={form.branch} onValueChange={(v) => update("branch", v)}>
                <SelectTrigger id="branch" className="w-full h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduation_year">Graduation year</Label>
              <Input
                id="graduation_year"
                type="number"
                placeholder="2026"
                value={form.graduation_year}
                onChange={(e) => update("graduation_year", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cgpa">CGPA</Label>
            <Input
              id="cgpa"
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="8.5"
              value={form.cgpa}
              onChange={(e) => update("cgpa", e.target.value)}
              className="h-9"
            />
          </div>

          {displayError && (
            <div className="flex items-center gap-2 text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              <AlertCircle className="size-3.5 shrink-0" />
              {displayError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Create account
            <ArrowRight className="size-3.5" />
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
