import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Loader2, Check, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BrandMark } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "reset"]).default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to MedEu.Ai" },
      { name: "description", content: "Sign in or create your free MedEu.Ai account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const RESEND_COOLDOWN = 60;

type Step = "form" | "verify-signup" | "verify-recovery";

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect away if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const setMode = (m: "signin" | "signup" | "reset") => {
    setStep("form");
    setCode("");
    setOtpError(null);
    navigate({ to: "/auth", search: { mode: m }, replace: true });
  };

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        // Supabase obfuscates existing accounts: a user object with no identities
        // means this email is already registered (and likely already verified).
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          toast.info("Account already exists", {
            description: "Please sign in with your email and password instead.",
          });
          setMode("signin");
          return;
        }
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setStep("verify-signup");
        setCode("");
        startCooldown();
        toast.success("Verification code sent", { description: `We emailed a 6-digit code to ${email}.` });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/not confirmed|not verified/i.test(error.message)) {
            await supabase.auth.resend({ type: "signup", email });
            setStep("verify-signup");
            setCode("");
            startCooldown();
            toast.info("Verify your email", { description: "We sent you a new 6-digit code." });
            return;
          }
          throw error;
        }
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setStep("verify-recovery");
        setCode("");
        setNewPassword("");
        startCooldown();
        toast.success("Reset code sent", { description: `Enter the 6-digit code we emailed to ${email}.` });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }


  async function handleResend() {
    if (cooldown > 0) return;
    setOtpError(null);
    try {
      const { error } =
        step === "verify-signup"
          ? await supabase.auth.resend({ type: "signup", email })
          : await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      startCooldown();
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the code");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setOtpError("Enter the full 6-digit code.");
      return;
    }
    if (step === "verify-recovery" && newPassword.length < 6) {
      setOtpError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setOtpError(null);
    try {
      let error: { message: string } | null = null;
      if (step === "verify-signup") {
        // The signup confirmation code is issued as type "signup"; some flows
        // (e.g. resend after an email change) issue it as "email".
        const first = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
        if (first.error) {
          const second = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
          error = second.error ? first.error : null;
        }
      } else {
        const res = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
        error = res.error;
      }
      if (error) throw new Error(error.message);


      if (step === "verify-recovery") {
        const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
        if (upErr) throw upErr;
        toast.success("Password updated", { description: "You're signed in with your new password." });
      } else {
        toast.success("Email verified", { description: "Your account is ready." });
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtpError(/expired|invalid/i.test(msg) ? "That code is invalid or expired. Request a new one." : msg);
      setCode("");
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
      toast.success("Welcome");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  const isOtpStep = step !== "form";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="ink-section hidden flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
          <BrandMark className="h-10 w-10 rounded-md bg-white p-0.5" />
          MedEu.Ai
        </Link>
        <div>
          <h2 className="max-w-sm text-balance text-4xl font-extrabold leading-[1.1] tracking-tight">
            Your Personal AI Teacher, 24/7.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed opacity-80">
            Learn smarter. Understand better. Prepare with MedEu.Ai.
          </p>
          <ul className="mt-8 space-y-3 text-sm opacity-90">
            {[
              "Ask doubts anytime in English, हिन्दी or বাংলা",
              "Unlimited mock tests and previous-year papers",
              "Performance analysis after every attempt",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-60">
          © {new Date().getFullYear()} MedEu.Ai · Made in India for Indian exam aspirants.
        </p>
      </aside>

      {/* Form panel */}
      <div className="relative flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 text-base font-bold tracking-tight lg:invisible">
            <BrandMark className="h-9 w-9" />
            <span>
              MedEu<span className="text-primary">.Ai</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            {isOtpStep ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
                  {step === "verify-signup" ? "Verify your email" : "Enter reset code"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                  {step === "verify-signup" ? " Enter it once to activate your account." : " Then choose a new password."}
                </p>

                <form onSubmit={handleVerify} className="mt-7 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={code}
                      onChange={(v) => {
                        setCode(v);
                        setOtpError(null);
                      }}
                      containerClassName="justify-between"
                      autoFocus
                    >
                      <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-full rounded-md text-lg" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {step === "verify-recovery" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {otpError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {otpError}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {step === "verify-signup" ? "Verify & continue" : "Update password"}
                  </Button>
                </form>

                <div className="mt-5 flex flex-col items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(step === "verify-signup" ? "signup" : "signin")}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" /> Use a different email
                  </button>
                </div>
              </>
            ) : (
              <>
                {mode !== "reset" && (
                  <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">Sign in</TabsTrigger>
                      <TabsTrigger value="signup">Create account</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                <h1 className="mt-8 text-3xl font-extrabold tracking-tight">
                  {mode === "signup"
                    ? "Start learning free"
                    : mode === "reset"
                      ? "Reset your password"
                      : "Welcome back"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signup"
                    ? "One minute to set up. We'll email a 6-digit code to verify you."
                    : mode === "reset"
                      ? "We'll email you a 6-digit code to set a new password."
                      : "Sign in to continue with your AI teacher."}
                </p>

                {mode !== "reset" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-7 w-full"
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
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-3 text-muted-foreground">or with email</span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleEmailAuth} className={mode === "reset" ? "mt-7 space-y-4" : "space-y-4"}>
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
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Forgot password?
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

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "signup"
                      ? "Create free account"
                      : mode === "reset"
                        ? "Send reset code"
                        : "Sign in"}
                  </Button>
                </form>

                {mode === "reset" && (
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="mt-5 block w-full text-center text-sm text-muted-foreground hover:text-primary"
                  >
                    ← Back to sign in
                  </button>
                )}

                {mode === "signin" && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    New to MedEu.Ai?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Create a free account
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By continuing you agree to our terms and privacy policy.
                </p>
              </>
            )}
          </div>
        </div>
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
