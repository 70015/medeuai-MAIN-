import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/back-link";
import { examLabel, formatSeconds } from "@/lib/exam";
import { claimPaperForAttempt } from "@/lib/paper-pool.functions";
import { getPlanStatus } from "@/lib/plan.functions";


export const Route = createFileRoute("/_authenticated/tests/$slug")({
  head: () => ({ meta: [{ title: "Test briefing | MedEuAi" }] }),
  component: TestDetailsPage,
});

type SectionCfg = { subject_slug: string; count: number; label?: string };
type TestConfig = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};

function TestDetailsPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const claimPaper = useServerFn(claimPaperForAttempt);
  const planStatusFn = useServerFn(getPlanStatus);


  const { data: plan } = useQuery({
    queryKey: ["plan-status"],
    queryFn: () => planStatusFn(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mock-test", slug],
    queryFn: async () => {
      const { data: test, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!test) return null;
      const cfg = test.section_config as TestConfig | null;
      let questionCount = cfg?.total_questions ?? 0;
      let pattern: TestConfig | null = cfg;
      if (!questionCount) {
        const { data: syl } = await supabase
          .from("exam_syllabi")
          .select("pattern")
          .eq("target_exam", test.target_exam)
          .maybeSingle();
        const sylPattern = syl?.pattern as TestConfig | null;
        questionCount = sylPattern?.total_questions ?? 0;
        pattern = pattern ?? sylPattern;
      }
      return { test, questionCount, cfg, pattern };
    },
  });

  const testId = data?.test?.id;
  const { data: history } = useQuery({
    enabled: !!testId,
    queryKey: ["test-history", testId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("test_attempts")
        .select("id, score, total_marks, accuracy, time_taken_seconds, submitted_at, status")
        .eq("test_id", testId!)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return rows ?? [];
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      if (!data?.test) throw new Error("Test not loaded");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      // Free-plan cap: check existing in_progress first; only block creating a NEW attempt
      const { data: existing } = await supabase
        .from("test_attempts")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("test_id", data.test.id)
        .eq("status", "in_progress")
        .maybeSingle();
      let attemptId = existing?.id;
      if (!attemptId) {
        if (plan && !plan.canStartTest) {
          throw new Error(
            `Free plan limit reached (${plan.attemptsInWindow}/${plan.freeAttemptsAllowed} in ${plan.windowDays} days). Upgrade to Pro to continue.`,
          );
        }
        const { data: ins, error } = await supabase
          .from("test_attempts")
          .insert({
            user_id: u.user.id,
            test_id: data.test.id,
            total_marks: Number(data.test.total_marks),
          })
          .select("id")
          .single();
        if (error) throw error;
        attemptId = ins.id;
      }
      // Try pre-generated/reusable papers first, then fast DB-only bank assembly.
      // Never call live AI here; AI runs only in background/admin pool refill.
      const claim = await claimPaper({ data: { attemptId } });
      if (!claim.claimed && claim.source === "empty") {
        throw new Error("Paper is not ready yet. Please try again in a moment while the admin paper pool refills.");
      }
      return attemptId;

    },
    onSuccess: (attemptId) => {
      navigate({ to: "/attempt/$attemptId", params: { attemptId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  }
  if (!data?.test) {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Test not found.</p>
        <Link to="/tests" className="mt-3 inline-block">
          <Button variant="outline" size="sm">Back to Practice</Button>
        </Link>
      </div>
    );
  }
  const t = data.test;
  const sections = data.pattern?.sections ?? [];
  const dist = data.pattern?.difficulty_distribution;
  const difficulty = dist
    ? `Easy ${dist.easy ?? 0} · Medium ${dist.medium ?? 0} · Hard ${dist.hard ?? 0}`
    : "Balanced mix";
  const best = (history ?? []).reduce<number | null>((acc, h) => {
    const pct = Number(h.total_marks) > 0 ? (Number(h.score) / Number(h.total_marks)) * 100 : 0;
    return acc === null || pct > acc ? pct : acc;
  }, null);

  return (
    <div className="space-y-8 pb-4">
      <BackLink to="/tests" label="Back to Practice" />

      {/* Briefing header */}
      <section className="rounded-xl bg-[#04211C] dark:bg-card dark:border dark:border-border p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
          <span>{examLabel(t.target_exam)}</span>
          <span className="text-white/30">/</span>
          <span className="capitalize">{t.test_type.replace("_", " ")}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
        {t.description && <p className="mt-2 max-w-2xl text-sm text-white/70">{t.description}</p>}

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4">
          <Stat label="Questions" value={`${data.questionCount || "-"}`} />
          <Stat label="Time" value={`${t.duration_minutes} min`} />
          <Stat label="Marks" value={`${Number(t.total_marks)}`} hint={`-${Number(t.negative_marks)} per wrong`} />
          <Stat label="Difficulty" value={dist ? "Mixed" : "Balanced"} hint={difficulty} />
        </dl>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {/* Subjects */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Subjects covered
            </h2>
            {sections.length ? (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {sections.map((s, i) => (
                  <li key={`${s.subject_slug}-${i}`} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{s.label ?? s.subject_slug}</span>
                    <span className="text-muted-foreground">{s.count} questions</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Mixed syllabus paper, the exact subject split is drawn from the exam pattern at start.
              </p>
            )}
          </section>

          {/* Instructions */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Before you begin
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>The timer runs for {t.duration_minutes} minutes from the moment you start.</li>
              <li>You can move freely between questions and mark them for review.</li>
              <li>Negative marking: -{Number(t.negative_marks)} for each incorrect answer.</li>
              <li>Every answer is saved automatically; the paper submits itself when time ends.</li>
            </ul>
          </section>
        </div>

        {/* Previous performance */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your previous attempts
            </h2>
            {(history ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You haven’t attempted this paper yet. This run becomes your baseline.
              </p>
            ) : (
              <>
                {best !== null && (
                  <p className="mt-3 text-sm">
                    <span className="text-2xl font-bold">{Math.round(best)}%</span>{" "}
                    <span className="text-muted-foreground">best score</span>
                  </p>
                )}
                <ul className="mt-3 divide-y divide-border">
                  {(history ?? []).map((h) => (
                    <li key={h.id} className="py-2.5 text-sm">
                      <Link
                        to="/results/$attemptId"
                        params={{ attemptId: h.id }}
                        className="flex items-center justify-between gap-3 hover:text-primary"
                      >
                        <span>
                          {Number(h.score).toFixed(1)} / {Number(h.total_marks)}
                          <span className="ml-2 text-muted-foreground">{h.accuracy}% accuracy</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatSeconds(h.time_taken_seconds ?? 0)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {plan && !plan.isPro && (
            <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="text-sm font-medium">
                Free plan: {plan.attemptsInWindow} / {plan.freeAttemptsAllowed} attempts used
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Resets on a rolling {plan.windowDays}-day window. Pro gives you unlimited tests.
              </p>
              <Link to="/billing" className="mt-3 inline-block">
                <Button size="sm" variant="outline">
                  <Crown className="mr-1 h-4 w-4" /> Upgrade
                </Button>
              </Link>
            </section>
          )}
        </aside>
      </div>

      {/* Sticky start bar */}
      <div className="sticky bottom-[env(safe-area-inset-bottom)] z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {data.questionCount || "-"} questions · {t.duration_minutes} minutes · exam conditions
          </div>
          <Button
            size="lg"
            onClick={() => start.mutate()}
            disabled={start.isPending || (plan ? !plan.canStartTest : false)}
          >
            <PlayCircle className="mr-1.5 h-4 w-4" />
            {start.isPending
              ? "Starting test…"
              : plan && !plan.canStartTest
                ? "Free limit reached"
                : "Start test"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-white/60">{hint}</dd>}
    </div>
  );
}
