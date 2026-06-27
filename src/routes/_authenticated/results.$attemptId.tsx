import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MinusCircle, Target, Trophy, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/app-shell";
import { formatSeconds, localize, type Lang } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({ meta: [{ title: "Result — ParikshaSathi" }] }),
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

      const { data: mtq } = await supabase
        .from("mock_test_questions")
        .select("position, marks, questions:question_id (id, question, options, correct_index, explanation)")
        .eq("test_id", attempt.test_id)
        .order("position");

      const { data: answers } = await supabase
        .from("attempt_answers")
        .select("question_id, selected_index, is_correct, awarded_marks")
        .eq("attempt_id", attemptId);

      const answerMap = new Map(
        (answers ?? []).map((a) => [a.question_id, a]),
      );

      return { attempt, items: mtq ?? [], answerMap };
    },
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted/40" />;
  if (!data) return <Card className="p-8 text-center">Result not found.</Card>;

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
  const scorePct = a.total_marks > 0 ? Math.round((Number(a.score) / Number(a.total_marks)) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/40 p-6 sm:p-8">
        <Badge variant="secondary" className="mb-2">{a.mock_tests.title}</Badge>
        <h1 className="text-2xl font-bold tracking-tight">Your result</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Trophy} label="Score" value={`${Number(a.score).toFixed(2)} / ${Number(a.total_marks)}`} hint={`${scorePct}%`} tint="primary" />
          <Metric icon={Target} label="Accuracy" value={`${a.accuracy}%`} hint={`${a.correct_count} correct`} tint="success" />
          <Metric icon={Clock} label="Time" value={formatSeconds(a.time_taken_seconds ?? 0)} hint="Total taken" tint="primary" />
          <Metric icon={XCircle} label="Wrong / Skipped" value={`${a.incorrect_count} / ${a.skipped_count}`} hint="Review below" tint="warning" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/tests/$slug" params={{ slug: a.mock_tests.slug }}>
            <Button variant="outline" size="sm">Retake test</Button>
          </Link>
          <Link to="/leaderboard">
            <Button size="sm">See leaderboard</Button>
          </Link>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-base font-semibold">Question-wise analysis</h2>
        <div className="space-y-3">
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
              <Card key={q.id} className="border-border/60 bg-card/40 p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Q{row.position}</Badge>
                  <StatusBadge status={status} />
                  {ans && (
                    <Badge variant="outline" className="text-[10px]">
                      {Number(ans.awarded_marks) >= 0 ? "+" : ""}
                      {Number(ans.awarded_marks).toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm">{localize(q.question, lang)}</p>
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.correct_index;
                    const isUserPick = i === sel;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                          isAnswer && "border-success bg-success/10",
                          isUserPick && !isAnswer && "border-destructive bg-destructive/10",
                          !isAnswer && !isUserPick && "border-border/60",
                        )}
                      >
                        <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                        <span className="grow">{localize(opt, lang)}</span>
                        {isAnswer && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {isUserPick && !isAnswer && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    );
                  })}
                </div>
                {q.explanation ? (
                  <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-3 text-xs">
                    <div className="mb-1 font-semibold text-foreground">Explanation</div>
                    <p className="text-muted-foreground">{localize(q.explanation, lang)}</p>
                  </div>
                ) : null}
              </Card>
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
      <Badge className="bg-success/20 text-success" variant="secondary">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Correct
      </Badge>
    );
  if (status === "wrong")
    return (
      <Badge className="bg-destructive/20 text-destructive" variant="secondary">
        <XCircle className="mr-1 h-3 w-3" /> Incorrect
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <MinusCircle className="mr-1 h-3 w-3" /> Skipped
    </Badge>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tint: "primary" | "success" | "warning";
}) {
  const cls =
    tint === "primary"
      ? "bg-primary/15 text-primary"
      : tint === "success"
        ? "bg-success/15 text-success"
        : "bg-warning/15 text-warning";
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className={cn("grid h-9 w-9 place-items-center rounded-lg", cls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
