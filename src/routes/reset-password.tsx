import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ogcraft/logo";
import { Loader2, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — OGCraft" },
      { name: "description", content: "Choose a new password for your OGCraft account." },
      { property: "og:title", content: "Reset password — OGCraft" },
      { property: "og:description", content: "Securely reset your OGCraft account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setReady(hash.get("type") === "recovery" || Boolean(hash.get("access_token")));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setBusy(false);
    } else {
      setMessage({ type: "success", text: "Password updated. Redirecting…" });
      setTimeout(() => navigate({ to: "/dashboard" }), 900);
    }
  }

  return (
    <main className="auth-shell min-h-screen flex items-center justify-center px-4 py-12">
      <div className="auth-panel w-full max-w-md animate-fade-up">
        <div className="text-center mb-10">
          <Logo className="mx-auto mb-6" />
          <p className="font-mono text-[10px] uppercase text-primary tracking-wider">
            Developer access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready ? "Enter your new password below." : "This recovery link is missing or expired."}
          </p>
        </div>

        {ready ? (
          <form className="space-y-4" onSubmit={submit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="new-password"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={cn(
                    "pl-10 pr-12",
                    error &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  placeholder="••••••••"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "password-error" : undefined}
                  disabled={busy}
                  autoComplete="new-password"
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
              {error && (
                <p
                  id="password-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="size-3" />
                  {error}
                </p>
              )}
            </div>

            {message && (
              <div
                className={cn(
                  "rounded-lg p-3 text-sm flex items-start gap-2 animate-slide-down",
                  message.type === "error" &&
                    "border-destructive/30 bg-destructive/10 text-destructive",
                  message.type === "success" && "border-success/30 bg-success/10 text-success",
                )}
                role="alert"
                aria-live="polite"
              >
                {message.type === "error" && (
                  <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                )}
                {message.type === "success" && (
                  <CheckCircle className="size-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
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
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This recovery link is missing or expired.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth" className="flex items-center justify-center gap-2">
                Request a new one
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
