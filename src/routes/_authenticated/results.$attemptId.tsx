import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, GraduationCap, MinusCircle, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/back-link";
import { useProfile } from "@/components/app-shell";
import { formatSeconds, localize, type Lang } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({ meta: [{ title: "Test analysis | MedEuAi" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { attemptId } = Route.useParams();
  const { data: profile } = useProfile();
  const lang: Lang = (profile?.preferred_language as Lang) ?? "english";

  const { data, isLoading } = useQuery({
    queryKey: ["results", attemptId],
    queryFn: async () => {
      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .select("*, mock_tests:test_id (id, slug, title, total_marks, duration_minutes)")
        .eq("id", attemptId)
        .maybeSingle();
      if (error) throw error;
      if (!attempt) return null;

      // Answers + correct_index are only released by this RPC after the
      // attempt is submitted (or to admins). The questions table's
      // correct_index column is not readable by clients directly.
      const { data: review, error: rErr } = await supabase.rpc("get_attempt_review", {
        p_attempt_id: attemptId,
      });
      if (rErr) throw rErr;

      const items = (review ?? []).map((r) => ({
        position: r.q_position,
        marks: r.marks,
        options_order: r.options_order,
        section_label: r.section_label,
        questions: {
          id: r.question_id,
          question: r.q_question,
          options: r.q_options,
          correct_index: r.correct_index,
          explanation: r.explanation,
        },
      }));

      const answerMap = new Map(
        (review ?? []).map((r) => [
          r.question_id,
          {
            question_id: r.question_id,
            selected_index: r.selected_index,
            is_correct: r.is_correct,
            awarded_marks: r.awarded_marks,
          },
        ]),
      );

      return { attempt, items, answerMap };
    },
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  if (!data) return <div className="rounded-xl border border-border p-8 text-center">Result not found.</div>;

  const a = data.attempt as {
    score: number;
    total_marks: number;
    correct_count: number;
    incorrect_count: number;
    skipped_count: number;
    accuracy: number;
    time_taken_seconds: number | null;
    mock_tests: { slug: string; title: string };
  };
  const scorePct =
    a.total_marks > 0 ? Math.round((Number(a.score) / Number(a.total_marks)) * 100) : 0;

  // Weak areas from the review data already loaded (section-wise accuracy).
  const bySection = new Map<string, { total: number; correct: number }>();
  data.items.forEach((row) => {
    const label = row.section_label ?? "General";
    const ans = data.answerMap.get(row.questions.id);
    const entry = bySection.get(label) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (ans?.is_correct) entry.correct += 1;
    bySection.set(label, entry);
  });
  const sectionStats = [...bySection.entries()]
    .map(([label, s]) => ({
      label,
      total: s.total,
      correct: s.correct,
      pct: Math.round((s.correct / Math.max(1, s.total)) * 100),
    }))
    .sort((x, y) => x.pct - y.pct);
  const weakAreas = sectionStats.filter((s) => s.pct < 100);

  const mistakePrompt =
    `I just finished the mock test "${a.mock_tests.title}" and scored ${Number(a.score).toFixed(1)}/${Number(a.total_marks)} with ${a.accuracy}% accuracy. ` +
    (weakAreas.length
      ? `I was weakest in ${weakAreas.slice(0, 3).map((w) => `${w.label} (${w.pct}%)`).join(", ")}. Explain where I'm going wrong and give me a short practice plan.`
      : `Explain the concepts I should revise next and give me a short practice plan.`);

  return (
    <div className="space-y-10 pb-4">
      <BackLink to="/tests" label="Back to Practice" />
      {/* Score */}
      <section className="rounded-xl bg-[#04211C] dark:bg-card dark:border dark:border-border p-6 text-white sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
          {a.mock_tests.title}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {Number(a.score).toFixed(2)}
          <span className="text-xl font-medium text-white/50"> / {Number(a.total_marks)}</span>
        </h1>
        <p className="mt-1 text-sm text-white/70">{scorePct}% score · {a.accuracy}% accuracy</p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-5">
          <DarkStat label="Accuracy" value={`${a.accuracy}%`} />
          <DarkStat label="Correct" value={`${a.correct_count}`} />
          <DarkStat label="Wrong" value={`${a.incorrect_count}`} />
          <DarkStat label="Skipped" value={`${a.skipped_count}`} />
          <DarkStat label="Time spent" value={formatSeconds(a.time_taken_seconds ?? 0)} />
        </dl>

        <div className="mt-7 flex flex-wrap gap-2">
          <Link to="/ai-teacher" search={{ q: mistakePrompt }}>
            <Button size="lg" className="bg-white text-[#04211C] hover:bg-white/90">
              <GraduationCap className="mr-1.5 h-4 w-4" /> Ask MedEu to explain your mistakes
            </Button>
          </Link>
          <Link to="/tests/$slug" params={{ slug: a.mock_tests.slug }}>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Retake test
            </Button>
          </Link>
        </div>
      </section>

      {/* Weak areas */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Your weak areas</h2>
        {sectionStats.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Section-wise data isn’t available for this paper.
          </p>
        ) : weakAreas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing weak here, you answered every section correctly. Try a harder paper.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {weakAreas.map((w) => (
              <li key={w.label} className="py-3.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">{w.label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {w.correct}/{w.total} correct · {w.pct}%
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${w.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommended practice */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recommended practice</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {weakAreas.length
            ? `Start with ${weakAreas[0].label}, it was your lowest-scoring area in this paper.`
            : "Keep the momentum: attempt another full paper under timed conditions."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/tests">
            <Button variant="outline">
              Browse practice tests <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/tests/$slug" params={{ slug: a.mock_tests.slug }}>
            <Button variant="ghost">Retake this paper</Button>
          </Link>
        </div>
      </section>

      {/* Question-wise analysis */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Question-wise analysis</h2>
        <div className="mt-4 space-y-4">
          {data.items.map((row) => {
            const q = row.questions as {
              id: string;
              question: unknown;
              options: unknown[];
              correct_index: number;
              explanation: unknown;
            };
            const ans = data.answerMap.get(q.id);
            const sel = ans?.selected_index ?? null;
            const isCorrect = ans?.is_correct;
            const status: "correct" | "wrong" | "skipped" =
              sel === null || sel === undefined ? "skipped" : isCorrect ? "correct" : "wrong";
            return (
              <article key={q.id} className="rounded-xl border border-border p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Q{row.position}</span>
                  <StatusBadge status={status} />
                  {ans && (
                    <span className="text-xs text-muted-foreground">
                      {Number(ans.awarded_marks) >= 0 ? "+" : ""}
                      {Number(ans.awarded_marks).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm sm:text-base">
                  {localize(q.question, lang)}
                </p>
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.correct_index;
                    const isUserPick = i === sel;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                          isAnswer && "border-primary bg-primary/5",
                          isUserPick && !isAnswer && "border-destructive bg-destructive/5",
                          !isAnswer && !isUserPick && "border-border",
                        )}
                      >
                        <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                        <span className="grow">{localize(opt, lang)}</span>
                        {isAnswer && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        {isUserPick && !isAnswer && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation ? (
                  <div className="mt-3 border-t border-border pt-3 text-xs">
                    <div className="mb-1 font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Explanation
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {localize(q.explanation, lang)}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: "correct" | "wrong" | "skipped" }) {
  if (status === "correct")
    return (
      <Badge variant="secondary" className="text-[10px]">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Correct
      </Badge>
    );
  if (status === "wrong")
    return (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px]">
        <XCircle className="mr-1 h-3 w-3" /> Incorrect
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      <MinusCircle className="mr-1 h-3 w-3" /> Skipped
    </Badge>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
