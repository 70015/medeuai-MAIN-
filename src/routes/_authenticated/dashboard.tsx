import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Brain,
  Flame,
  PlayCircle,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/components/app-shell";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { PlanBanner } from "@/components/plan-banner";


const EXAM_GRID = [
  { code: "ssc_cgl", label: "SSC CGL", desc: "Combined Graduate Level" },
  { code: "ssc_chsl", label: "SSC CHSL", desc: "Higher Secondary" },
  { code: "wbcs", label: "WBCS", desc: "WB Civil Service" },
  { code: "wbpsc", label: "WBPSC", desc: "Public Service Comm." },
  { code: "railway", label: "Railway", desc: "RRB NTPC / Group D" },
  { code: "banking", label: "Banking", desc: "IBPS, SBI PO/Clerk" },
  { code: "police", label: "Police", desc: "WBP, Kolkata Police" },
  { code: "other", label: "Other", desc: "More test series" },
] as const;

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your learning home | MedEuAi" },
      {
        name: "description",
        content:
          "Your daily preparation home on MedEuAi: today's goal, AI Teacher, practice recommendations and progress.",
      },
      { property: "og:title", content: "Your learning home | MedEuAi" },
      {
        property: "og:description",
        content: "Daily goal, AI Teacher and practice recommendations in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });
}

/** Recent attempts, used for "Continue preparing" and progress stats. */
function useAttempts() {
  return useQuery({
    queryKey: ["dashboard", "attempts"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("test_attempts")
        .select(
          "id, status, accuracy, correct_count, incorrect_count, skipped_count, started_at, submitted_at, test_id, mock_tests(title, slug)",
        )
        .eq("user_id", u.user.id)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: attempts = [], isLoading: attemptsLoading } = useAttempts();

  const name = profile?.full_name?.split(" ")[0] ?? "there";

  const inProgress = attempts.find((a) => a.status === "in_progress");
  const submitted = attempts.filter((a) => a.status !== "in_progress");

  const questionsSolved = submitted.reduce(
    (n, a) => n + (a.correct_count ?? 0) + (a.incorrect_count ?? 0),
    0,
  );
  const accuracy =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((n, a) => n + Number(a.accuracy ?? 0), 0) / submitted.length,
        )
      : 0;

  const today = new Date().toDateString();
  const todaysAttempts = submitted.filter(
    (a) => new Date(a.submitted_at ?? a.started_at).toDateString() === today,
  );
  const questionsToday = todaysAttempts.reduce(
    (n, a) => n + (a.correct_count ?? 0) + (a.incorrect_count ?? 0) + (a.skipped_count ?? 0),
    0,
  );
  const dailyGoalQuestions = 25;
  const goalPct = Math.min(100, Math.round((questionsToday / dailyGoalQuestions) * 100));
  const estimatedMinutes = Math.max(
    0,
    Math.round(((dailyGoalQuestions - questionsToday) * 24) / 60),
  );

  const targetExam = profile?.target_exam ?? null;
  const recommendation = !submitted.length
    ? "Start with one 25-question mock. It gives MedEu enough signal to personalise your practice."
    : accuracy < 50
      ? "Your accuracy is under 50%. Ask MedEu to explain the questions you got wrong before your next mock."
      : accuracy < 75
        ? "You're close to a strong score. Do one more mock today and review every incorrect answer with MedEu."
        : "Great accuracy. Push into harder previous-year papers to keep improving your speed.";

  return (
    <div className="space-y-10">
      <OnboardingFlow name={profile?.full_name?.split(" ")[0]} />

      <PlanBanner />



      {/* Greeting */}
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{profile?.plan === "free" ? "Free plan" : "Pro plan"}</Badge>
          {targetExam && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> {examLabel(targetExam)}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Ready for today&apos;s preparation?
        </p>
      </section>

      {/* Daily goal */}
      <section className="border-y border-border py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s goal
            </h2>
            <p className="mt-2 text-2xl font-bold">
              {questionsToday}
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                / {dailyGoalQuestions} questions
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{goalPct}%</div>
            <div className="text-xs text-muted-foreground">
              {goalPct >= 100 ? "Goal complete" : `≈ ${estimatedMinutes} min left`}
            </div>
          </div>
        </div>
        <Progress value={goalPct} className="mt-4" />
      </section>

      {/* AI Teacher, hero of the app */}
      <section className="rounded-xl bg-ink p-6 text-ink-foreground sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-foreground/70">
          <Brain className="h-4 w-4" /> AI Teacher
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Ask MedEu anything.
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-foreground/80">
          Explanations at your level, step-by-step solutions and honest feedback, any subject, any
          time.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/ai-teacher">
            <Button variant="secondary">
              Start a lesson
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/tests">
            <Button
              variant="ghost"
              className="text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
            >
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Take a mock test
            </Button>
          </Link>
        </div>
      </section>

      {/* Continue preparing */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Continue preparing
        </h2>
        <div className="mt-4 rounded-lg border border-border p-5">
          {attemptsLoading ? (
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          ) : inProgress ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  {inProgress.mock_tests?.title ?? "Mock test in progress"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Started {new Date(inProgress.started_at).toLocaleString()}
                </div>
              </div>
              <Link to="/attempt/$attemptId" params={{ attemptId: inProgress.id }}>
                <Button>
                  Resume test
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : submitted[0] ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  {submitted[0].mock_tests?.title ?? "Last mock test"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Scored {Math.round(Number(submitted[0].accuracy ?? 0))}% accuracy · review it or
                  take the next one.
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/results/$attemptId" params={{ attemptId: submitted[0].id }}>
                  <Button variant="outline">Review</Button>
                </Link>
                <Link to="/tests">
                  <Button>Next test</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold">No session in progress</div>
                <div className="text-xs text-muted-foreground">
                  Your first mock test takes about 10 minutes.
                </div>
              </div>
              <Link to="/tests">
                <Button>Start your first test</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended practice */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended practice
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {targetExam
                ? `Based on your target exam, ${examLabel(targetExam)}.`
                : "Pick an exam to personalise your practice."}
            </p>
          </div>
          <Link
            to="/tests"
            search={{ exam: "all" }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedExams(targetExam).map((e) => (
            <Link
              key={e.code}
              to="/tests"
              search={{ exam: e.code }}
              className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{e.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{e.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Progress */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your progress
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Tests completed" value={`${submitted.length}`} />
          <Stat label="Questions solved" value={`${questionsSolved}`} />
          <Stat
            label="Study streak"
            value={`${profile?.current_streak ?? 0}d`}
            hint={`Best ${profile?.longest_streak ?? 0}d`}
          />
        </dl>
      </section>

      {/* Sathi recommendation */}
      <section className="rounded-lg border border-border p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
            <Flame className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">MedEu recommends</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Reading your recent activity…" : recommendation}
            </p>
            <Link
              to="/ai-teacher"
              className="mt-3 inline-flex items-center text-xs font-semibold text-primary hover:underline"
            >
              Talk to MedEu about this <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section>
          <Link to="/admin">
            <Button variant="outline">
              <Shield className="mr-1.5 h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-background p-4">
      <dd className="text-2xl font-bold">{value}</dd>
      <dt className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</dt>
      {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function orderedExams(target: string | null) {
  if (!target) return EXAM_GRID.slice(0, 6);
  const match = EXAM_GRID.filter((e) => e.code === target);
  const rest = EXAM_GRID.filter((e) => e.code !== target);
  return [...match, ...rest].slice(0, 6);
}

function examLabel(code: string | null | undefined) {
  switch (code) {
    case "ssc_cgl":
      return "SSC CGL";
    case "ssc_chsl":
      return "SSC CHSL";
    case "wbcs":
      return "WBCS";
    case "wbpsc":
      return "WBPSC";
    case "railway":
      return "Railway";
    case "banking":
      return "Banking";
    case "police":
      return "Police";
    default:
      return "Not set";
  }
}
