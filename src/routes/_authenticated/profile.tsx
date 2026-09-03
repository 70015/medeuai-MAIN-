import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CreditCard,
  HelpCircle,
  KeyRound,
  Languages,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  Shield,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/app-shell";
import { ProfilePhoto } from "@/components/profile-photo";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile | MedEuAi" },
      {
        name: "description",
        content:
          "Manage your MedEuAi profile: target exam, preparation level, language, notifications, subscription and account settings.",
      },
      { property: "og:title", content: "Your profile | MedEuAi" },
      {
        property: "og:description",
        content: "Target exam, language, subscription and account settings in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const examOptions = [
  { value: "ssc_cgl", label: "SSC CGL" },
  { value: "ssc_chsl", label: "SSC CHSL" },
  { value: "wbcs", label: "WBCS" },
  { value: "wbpsc", label: "WBPSC" },
  { value: "railway", label: "Railway" },
  { value: "banking", label: "Banking" },
  { value: "police", label: "Police" },
  { value: "other", label: "Other" },
] as const;

const langOptions = [
  { value: "english", label: "English" },
  { value: "bengali", label: "বাংলা (Bengali)" },
  { value: "hindi", label: "हिन्दी (Hindi)" },
] as const;

/** Preparation level captured during onboarding, stored client-side only. */
function readOnboardingLevel(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("medeuai-onboarding");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { level?: string };
    return parsed?.level ?? null;
  } catch {
    return null;
  }
}

/** In-app password change, requires the current password, no email link needed. */
function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  const strength =
    newPassword.length === 0
      ? null
      : newPassword.length < 8
        ? "Too short, use at least 8 characters."
        : /^(?=.*[a-zA-Z])(?=.*\d).+$/.test(newPassword)
          ? null
          : "Add at least one letter and one number.";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!currentPassword) return setError("Enter your current password.");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(newPassword))
      return setError("New password must include at least one letter and one number.");
    if (newPassword !== confirmPassword) return setError("The two new passwords don't match.");
    if (newPassword === currentPassword)
      return setError("New password must be different from your current one.");

    setBusy(true);
    try {
      const { error: upErr } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      } as never);
      if (upErr) throw upErr;
      toast.success("Password updated", {
        description: "Use your new password the next time you sign in.",
      });
      reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update your password";
      setError(
        /invalid|incorrect|credential/i.test(msg)
          ? "Your current password is incorrect."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-4">
        <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 grow">
          <div className="text-sm font-medium">Password</div>
          <div className="text-xs text-muted-foreground">
            Change your password here, no email link needed.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            setOpen((o) => !o);
          }}
        >
          {open ? "Cancel" : "Change password"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 max-w-md space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {strength ?? "At least 8 characters, with a letter and a number."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}


function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [targetExam, setTargetExam] = useState<string>("ssc_cgl");
  const [language, setLanguage] = useState<string>("english");
  const [dailyGoal, setDailyGoal] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    setLevel(readOnboardingLevel());
  }, []);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setTargetExam(profile.target_exam ?? "ssc_cgl");
    setLanguage(profile.preferred_language ?? "english");
    setDailyGoal(profile.daily_goal_minutes ?? 30);
  }, [profile]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          target_exam: targetExam as never,
          preferred_language: language as never,
          daily_goal_minutes: dailyGoal,
        })
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.assign("/auth?mode=signin");
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = (profile.full_name || profile.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const examName =
    examOptions.find((e) => e.value === profile.target_exam)?.label ?? null;

  return (
    <div className="space-y-10 pb-4">
      {/* Identity */}
      <header className="rounded-xl bg-[#04211C] dark:bg-card dark:border dark:border-border p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfilePhoto
            userId={profile.id}
            avatarUrl={profile.avatar_url}
            initials={initials}
            name={profile.full_name}
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {profile.full_name || "Add your name"}
            </h1>
            <p className="mt-1 truncate text-sm text-white/60">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/20 px-2.5 py-1 text-white/80">
                {examName ? `Target: ${examName}` : "Target exam not set"}
              </span>
              <span className="rounded-full border border-white/20 px-2.5 py-1 text-white/80">
                {level ? `Level: ${level}` : "Level not set"}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white">
                {profile.plan === "free" ? "Free plan" : "Pro plan"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* My preparation, education preferences */}
      <section>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">My preparation</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          What you're studying for and how much you plan to study each day.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Target exam</Label>
            <Select value={targetExam} onValueChange={setTargetExam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examOptions.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">Daily goal (minutes)</Label>
            <Input
              id="goal"
              type="number"
              min={5}
              max={480}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Preparation level</Label>
            <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
              {level
                ? `${level}, set during onboarding and used by the AI Teacher.`
                : "Not set yet. The AI Teacher will adapt as you chat with it."}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Link to="/progress" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            View your preparation progress <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Language */}
      <section>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Language</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Used for questions and AI Teacher explanations where available.
        </p>
        <div className="mt-4 max-w-sm space-y-1.5">
          <Label>Preferred language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {langOptions.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
        </div>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Study reminders aren't available yet. For now, your daily goal on the home screen tracks
          today's practice.
        </p>
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-y border-border py-5">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preparation settings
        </Button>
      </div>

      {/* Account & settings, distinct from education */}
      <section>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Account &amp; settings</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscription, sign-in details and support.
        </p>

        <div className="mt-4 divide-y divide-border border-y border-border">
          <Link to="/billing" className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40">
            <CreditCard className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 grow">
              <div className="text-sm font-medium">Subscription</div>
              <div className="text-xs text-muted-foreground">
                Manage your plan, promo codes and invoices.
              </div>
            </div>
            <Badge variant="secondary">{profile.plan === "free" ? "Free" : "Pro"}</Badge>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-4 py-4">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 grow">
              <div className="text-sm font-medium">Account</div>
              <div className="truncate text-xs text-muted-foreground">
                Signed in as {profile.email}
              </div>
            </div>
          </div>

          <PasswordSection />


          <div className="space-y-1.5 py-4">
            <Label htmlFor="name">Display name</Label>
            <div className="flex max-w-md gap-2">
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Button variant="outline" onClick={save} disabled={saving}>
                Save
              </Button>
            </div>
          </div>

          <Link to="/about" className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40">
            <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 grow">
              <div className="text-sm font-medium">Help &amp; about</div>
              <div className="text-xs text-muted-foreground">
                What MedEuAi does, FAQs and contact.
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <a
            href="mailto:hello.medeu.ai@gmail.com"
            className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 grow">
              <div className="text-sm font-medium">Contact support</div>
              <div className="text-xs text-muted-foreground">
                For any questions, feedback or help, tap to email us.
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-primary hover:underline">
              hello.medeu.ai@gmail.com
            </span>
          </a>

          <Link
            to="/ai-teacher"
            search={{ q: "" }}
            className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40"
          >
            <LifeBuoy className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 grow">
              <div className="text-sm font-medium">Ask MedEu for help</div>
              <div className="text-xs text-muted-foreground">
                Stuck on a topic? Your AI Teacher is always available.
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <LogOut className="h-4 w-4 shrink-0 text-destructive" />
            <div className="text-sm font-medium text-destructive">Sign out</div>
          </button>
        </div>
      </section>
    </div>
  );
}
