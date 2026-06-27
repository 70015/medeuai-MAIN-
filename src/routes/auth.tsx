import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ThemeToggle } from "@/components/theme-toggle";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "reset"]).default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to ParikshaSathi" },
      { name: "description", content: "Sign in or create your free ParikshaSathi account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect away if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const setMode = (m: "signin" | "signup" | "reset") =>
    navigate({ to: "/auth", search: { mode: m }, replace: true });

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created", {
          description: "Check your inbox to verify your email, then sign in.",
        });
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset email sent", {
          description: "Check your inbox for password reset instructions.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      // popup flow — session set
      toast.success("Welcome");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background hero-bg">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            Pariksha<span className="text-primary">Sathi</span>
          </span>
        </Link>

        <Card className="w-full border-border/60 bg-card/70 p-6 backdrop-blur sm:p-8">
          {mode !== "reset" && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="mt-6 space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signup"
                ? "Start your prep journey"
                : mode === "reset"
                  ? "Reset your password"
                  : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "Free forever plan. No credit card required."
                : mode === "reset"
                  ? "We'll email you a link to set a new password."
                  : "Sign in to continue preparing."}
            </p>

            {mode !== "reset" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or with email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              {mode !== "reset" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("reset")}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={6}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
              </Button>
            </form>

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                ← Back to sign in
              </button>
            )}

            <p className="pt-2 text-center text-xs text-muted-foreground">
              By continuing you agree to our terms and privacy policy.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.07-1.1-.16-1.6H12z"
      />
    </svg>
  );
}
