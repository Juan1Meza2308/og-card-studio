import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ogcraft/logo";
import { cn } from "@/lib/utils";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  head: () =>
    buildSeo({
      title: "Log in — OGCraft",
      description: "Sign in to build and manage dynamic social preview images.",
      path: "/auth",
      noindex: true,
    }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  function validate() {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
    } = {};
    if (mode === "signup" && name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (mode !== "forgot" && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setMessage(null);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for a password reset link." });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/dashboard" });
        } else {
          setMessage({ type: "success", text: "Account created! Check your email to confirm." });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const error = err as Error;
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  }

  const clearMessage = () => setMessage(null);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="auth-shell min-h-screen flex items-center justify-center px-4 py-12"
    >
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Back to home"
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      <div className="auth-panel w-full max-w-md animate-fade-up">
        <div className="text-center mb-10">
          <Logo className="mx-auto mb-6" />
          <p className="font-mono text-[10px] uppercase text-primary tracking-wider">
            Developer access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {mode === "login"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll send a secure reset link to your inbox."
              : "Generate production-ready OG images in milliseconds."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit} noValidate>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Display name
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="name"
                  required
                  minLength={2}
                  maxLength={50}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className={cn(
                    "pl-10",
                    errors.name &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  placeholder="Jane Developer"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  disabled={busy}
                />
              </div>
              {errors.name && (
                <p
                  id="name-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="size-3" />
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                required
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={cn(
                  "pl-10",
                  errors.email &&
                    "border-destructive focus:border-destructive focus:ring-destructive/20",
                )}
                placeholder="you@example.com"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                disabled={busy}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                className="text-xs text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="size-3" />
                {errors.email}
              </p>
            )}
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={cn(
                    "pl-10 pr-12",
                    errors.password &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  disabled={busy}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  disabled={busy}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="size-3" />
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {message && (
            <div
              className={cn(
                "rounded-lg p-3 text-sm flex items-start gap-2 animate-slide-down",
                message.type === "error" &&
                  "border-destructive/30 bg-destructive/10 text-destructive",
                message.type === "success" && "border-success/30 bg-success/10 text-success",
                message.type === "info" && "border-primary/30 bg-primary/10 text-primary",
              )}
              role="alert"
              aria-live="polite"
            >
              {message.type === "error" && <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />}
              {message.type === "success" && (
                <CheckCircle className="size-4 flex-shrink-0 mt-0.5" />
              )}
              {message.type === "info" && <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />}
              <span>{message.text}</span>
              <button
                type="button"
                onClick={clearMessage}
                className="ml-auto text-current/60 hover:text-current transition-colors"
                aria-label="Dismiss message"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 text-sm font-medium"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Log in"
            ) : mode === "signup" ? (
              "Create free account"
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-sm">
          <p className="text-center text-muted-foreground">
            {mode === "signup"
              ? "Already have an account? "
              : mode === "forgot"
                ? "Back to "
                : "Don't have an account? "}
            <button
              type="button"
              className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              onClick={() => {
                setMode(mode === "signup" ? "login" : mode === "forgot" ? "login" : "signup");
                setMessage(null);
                setErrors({});
              }}
            >
              {mode === "signup" ? "Log in" : mode === "forgot" ? "login" : "Create an account"}
            </button>
          </p>
          {mode !== "forgot" && (
            <p className="text-center text-muted-foreground">
              <button
                type="button"
                className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                onClick={() => {
                  setMode("forgot");
                  setMessage(null);
                  setErrors({});
                }}
              >
                Forgot password?
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
