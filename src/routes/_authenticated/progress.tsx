import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Trophy } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-logo";
import { examLabel } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Your preparation, Progress | MedEuAi" },
      {
        name: "description",
        content:
          "Track your exam preparation on MedEuAi: accuracy, questions solved, tests completed, study time, streak, subject performance and weak topics.",
      },
      { property: "og:title", content: "Your preparation, Progress | MedEuAi" },
      {
        property: "og:description",
        content: "Accuracy, subject performance, weak topics and improvement trend in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

type Attempt = {
  id: string;
  status: string;
  accuracy: number | null;
  score: number | null;
  total_marks: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  skipped_count: number | null;
  time_taken_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  mock_tests: { title: string; slug: string; target_exam: string } | null;
};

function useProgressData() {
  return useQuery({
    queryKey: ["progress", "overview"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { attempts: [] as Attempt[], sections: [] as SectionRow[] };

      const { data: attempts, error } = await supabase
        .from("test_attempts")
        .select(
          "id, status, accuracy, score, total_marks, correct_count, incorrect_count, skipped_count, time_taken_seconds, started_at, submitted_at, mock_tests(title, slug, target_exam)",
        )
        .eq("user_id", u.user.id)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const submittedIds = (attempts ?? [])
        .filter((a) => a.status !== "in_progress")
        .map((a) => a.id);

      if (submittedIds.length === 0) {
        return { attempts: (attempts ?? []) as Attempt[], sections: [] as SectionRow[] };
      }

      const [{ data: aq }, { data: ans }] = await Promise.all([
        supabase
          .from("attempt_questions")
          .select("attempt_id, question_id, section_label")
          .in("attempt_id", submittedIds),
        supabase
          .from("attempt_answers")
          .select("attempt_id, question_id, is_correct, selected_index")
          .in("attempt_id", submittedIds),
      ]);

      const labelByKey = new Map<string, string>();
      (aq ?? []).forEach((r) => {
        labelByKey.set(`${r.attempt_id}:${r.question_id}`, r.section_label ?? "General");
      });

      const agg = new Map<string, { total: number; correct: number; attempted: number }>();
      (aq ?? []).forEach((r) => {
        const label = r.section_label ?? "General";
        const e = agg.get(label) ?? { total: 0, correct: 0, attempted: 0 };
        e.total += 1;
        agg.set(label, e);
      });
      (ans ?? []).forEach((r) => {
        const label = labelByKey.get(`${r.attempt_id}:${r.question_id}`) ?? "General";
        const e = agg.get(label) ?? { total: 0, correct: 0, attempted: 0 };
        if (r.selected_index !== null && r.selected_index !== undefined) e.attempted += 1;
        if (r.is_correct) e.correct += 1;
        agg.set(label, e);
      });

      const sections: SectionRow[] = [...agg.entries()]
        .map(([label, s]) => ({
          label,
          total: s.total,
          attempted: s.attempted,
          correct: s.correct,
          pct: Math.round((s.correct / Math.max(1, s.total)) * 100),
        }))
        .sort((a, b) => b.total - a.total);

      return { attempts: (attempts ?? []) as Attempt[], sections };
    },
  });
}

type SectionRow = {
  label: string;
  total: number;
  attempted: number;
  correct: number;
  pct: number;
};

function streakDays(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => d.toDateString()));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to start today or yesterday.
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function ProgressPage() {
  const { data: profile } = useProfile();
  const { data, isLoading } = useProgressData();

  const attempts = data?.attempts ?? [];
  const sections = data?.sections ?? [];
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
  const studySeconds = submitted.reduce((n, a) => n + (a.time_taken_seconds ?? 0), 0);
  const studyLabel =
    studySeconds >= 3600
      ? `${(studySeconds / 3600).toFixed(1)} h`
      : `${Math.round(studySeconds / 60)} min`;
  const streak = streakDays(
    submitted.map((a) => new Date(a.submitted_at ?? a.started_at)),
  );

  // Trend: oldest → newest score percentage of submitted attempts.
  const trend = [...submitted]
    .reverse()
    .map((a) => ({
      id: a.id,
      title: a.mock_tests?.title ?? "Mock test",
      date: new Date(a.submitted_at ?? a.started_at),
      pct:
        Number(a.total_marks) > 0
          ? Math.round((Number(a.score) / Number(a.total_marks)) * 100)
          : Number(a.accuracy ?? 0),
    }))
    .slice(-8);
  const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
  const secondHalf = trend.slice(Math.floor(trend.length / 2));
  const avg = (arr: typeof trend) =>
    arr.length ? Math.round(arr.reduce((n, t) => n + t.pct, 0) / arr.length) : 0;
  const delta = trend.length >= 4 ? avg(secondHalf) - avg(firstHalf) : null;

  const weak = sections.filter((s) => s.total >= 2 && s.pct < 70).slice(0, 5);

  /** Premium AI-Teacher guidance derived from real attempt data. */
  const guidance = !submitted.length
    ? {
        focus: "Start with one full mock test",
        body: "You haven't completed a paper yet. One 25-question mock gives MedEu enough signal to pinpoint the exact areas holding your score back.",
      }
    : weak.length
      ? {
          focus: `Focus on ${weak[0].label}`,
          body: `Your recent tests show that this is one of your weaker areas, ${weak[0].pct}% accuracy over ${weak[0].total} questions. A few focused practice sessions could improve your accuracy.`,
        }
      : accuracy < 60
        ? {
            focus: "Focus on reviewing your mistakes",
            body: `Your overall accuracy is ${accuracy}%. Reviewing every incorrect answer before your next paper is the fastest way to lift that number.`,
          }
        : {
            focus: "Focus on speed under timed conditions",
            body: "Your accuracy is solid across every measured area. Attempt full papers against the clock so timing stops costing you marks.",
          };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-4">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Progress</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your preparation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile?.target_exam
            ? `Everything below is measured from your ${examLabel(profile.target_exam)} and other attempts.`
            : "Everything below is measured from the papers you have attempted."}
        </p>
      </header>

      {/* Headline metrics */}
      <section className="rounded-xl bg-[#04211C] p-6 text-white sm:p-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5">
          <DarkStat label="Accuracy" value={submitted.length ? `${accuracy}%` : "-"} />
          <DarkStat label="Questions solved" value={`${questionsSolved}`} />
          <DarkStat label="Tests completed" value={`${submitted.length}`} />
          <DarkStat label="Study time" value={submitted.length ? studyLabel : "-"} />
          <DarkStat label="Current streak" value={streak ? `${streak} day${streak > 1 ? "s" : ""}` : "-"} />
        </dl>
        {!submitted.length && (
          <p className="mt-6 border-t border-white/10 pt-5 text-sm text-white/70">
            No completed tests yet, so these numbers stay empty until your first submission.
          </p>
        )}
      </section>

      {/* Subject performance */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Subject performance</h2>
        {sections.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Subject-wise accuracy appears once you complete a paper that carries section labels.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {sections.map((s) => (
              <li key={s.label} className="py-3.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {s.correct}/{s.total} correct · {s.pct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full", s.pct < 50 ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${Math.max(2, s.pct)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Weak topics */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Weak topics</h2>
        {sections.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not enough data yet. Complete a mock test and your weakest areas will be listed here.
          </p>
        ) : weak.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing below 70% right now, every measured area is in good shape. Move to harder papers.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {weak.map((s) => (
              <li
                key={s.label}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm"
              >
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">
                  {s.pct}% accuracy over {s.total} questions
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Trend */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Trend</h2>
        {trend.length < 2 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your improvement trend needs at least two completed tests.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Score percentage across your last {trend.length} completed tests
              {delta !== null && (
                <>
                  {" "}·{" "}
                  <span className={delta >= 0 ? "font-medium text-primary" : "font-medium text-destructive"}>
                    {delta >= 0 ? "+" : ""}
                    {delta}% recent average
                  </span>
                </>
              )}
            </p>
            <div className="mt-5 flex items-end gap-2 border-b border-border pb-2">
              {trend.map((t) => (
                <div key={t.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground">{t.pct}%</span>
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${Math.max(4, t.pct * 1.1)}px` }}
                    title={`${t.title}, ${t.pct}%`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{trend[0].date.toLocaleDateString()}</span>
              <span>{trend[trend.length - 1].date.toLocaleDateString()}</span>
            </div>
          </>
        )}
      </section>

      {/* MedEu recommendation, premium AI Teacher guidance */}
      <section className="overflow-hidden rounded-xl bg-[#04211C] text-white">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 rounded-md bg-white p-0.5" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              MedEu recommends
            </p>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">{guidance.focus}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{guidance.body}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/tests">
              <Button className="bg-[#03824F] text-white hover:bg-[#02663E]">
                Practice now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link
              to="/ai-teacher"
              search={{
                q: weak.length
                  ? `Help me improve in ${weak[0].label}. My accuracy there is ${weak[0].pct}%. Explain the key concepts and give me 5 practice questions.`
                  : "",
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              <GraduationCap className="h-4 w-4" /> Work on it with your AI Teacher
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-border pt-6">
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Trophy className="h-4 w-4" /> Compare yourself on the leaderboard
        </Link>
      </div>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {label}
      </dt>
      <dd className="mt-1.5 text-xl font-semibold sm:text-2xl">{value}</dd>
    </div>
  );
}
