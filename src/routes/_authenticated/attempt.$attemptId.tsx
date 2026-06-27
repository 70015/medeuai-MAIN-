import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ChevronLeft, ChevronRight, Clock, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/components/app-shell";
import { formatSeconds, localize, type Lang } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attempt/$attemptId")({
  head: () => ({ meta: [{ title: "Attempt — ParikshaSathi" }] }),
  component: AttemptPage,
});

type LoadedAttempt = {
  attempt: {
    id: string;
    test_id: string;
    started_at: string;
    status: string;
  };
  test: {
    id: string;
    title: string;
    duration_minutes: number;
    negative_marks: number;
  };
  questions: Array<{
    id: string;
    position: number;
    marks: number;
    negative_marks: number;
    question: unknown;
    options: unknown;
  }>;
  answers: Record<string, { selected_index: number | null; is_marked: boolean }>;
};

function AttemptPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const lang: Lang = (profile?.preferred_language as Lang) ?? "english";

  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const { data, isLoading } = useQuery<LoadedAttempt | null>({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data: attempt, error: aErr } = await supabase
        .from("test_attempts")
        .select("id, test_id, started_at, status")
        .eq("id", attemptId)
        .maybeSingle();
      if (aErr) throw aErr;
      if (!attempt) return null;

      const { data: test, error: tErr } = await supabase
        .from("mock_tests")
        .select("id, title, duration_minutes, negative_marks")
        .eq("id", attempt.test_id)
        .single();
      if (tErr) throw tErr;

      const { data: mtq, error: qErr } = await supabase
        .from("mock_test_questions")
        .select("position, marks, negative_marks, questions:question_id (id, question, options)")
        .eq("test_id", attempt.test_id)
        .order("position");
      if (qErr) throw qErr;

      const questions = (mtq ?? []).map((r) => {
        const q = r.questions as { id: string; question: unknown; options: unknown };
        return {
          id: q.id,
          position: r.position,
          marks: Number(r.marks),
          negative_marks: Number(r.negative_marks),
          question: q.question,
          options: q.options,
        };
      });

      const { data: ans } = await supabase
        .from("attempt_answers")
        .select("question_id, selected_index, is_marked")
        .eq("attempt_id", attempt.id);
      const answers: LoadedAttempt["answers"] = {};
      (ans ?? []).forEach((a) => {
        answers[a.question_id] = {
          selected_index: a.selected_index,
          is_marked: a.is_marked,
        };
      });

      return { attempt, test: test!, questions, answers };
    },
  });

  // ticking timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Not loaded");
      // fetch correct indices server-side
      const ids = data.questions.map((q) => q.id);
      const { data: correctRows, error } = await supabase
        .from("questions")
        .select("id, correct_index")
        .in("id", ids);
      if (error) throw error;
      const correctMap = new Map<string, number>(
        (correctRows ?? []).map((r) => [r.id as string, r.correct_index as number]),
      );

      let score = 0;
      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      const rows = data.questions.map((q) => {
        const a = data.answers[q.id];
        const sel = a?.selected_index ?? null;
        const isCorrect = sel !== null && sel === correctMap.get(q.id);
        const awarded = sel === null ? 0 : isCorrect ? q.marks : -q.negative_marks;
        if (sel === null) skipped++;
        else if (isCorrect) correct++;
        else incorrect++;
        score += awarded;
        return {
          attempt_id: data.attempt.id,
          question_id: q.id,
          selected_index: sel,
          is_correct: sel === null ? null : isCorrect,
          is_marked: a?.is_marked ?? false,
          awarded_marks: awarded,
        };
      });

      const { error: upErr } = await supabase
        .from("attempt_answers")
        .upsert(rows, { onConflict: "attempt_id,question_id" });
      if (upErr) throw upErr;

      const total = data.questions.length;
      const attempted = total - skipped;
      const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10;
      const elapsed = Math.floor((Date.now() - new Date(data.attempt.started_at).getTime()) / 1000);

      const { error: sErr } = await supabase
        .from("test_attempts")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          time_taken_seconds: elapsed,
          score,
          correct_count: correct,
          incorrect_count: incorrect,
          skipped_count: skipped,
          accuracy,
        })
        .eq("id", data.attempt.id);
      if (sErr) throw sErr;
    },
    onSuccess: () => {
      toast.success("Submitted!");
      queryClient.invalidateQueries({ queryKey: ["attempt", attemptId] });
      navigate({ to: "/results/$attemptId", params: { attemptId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remainingSec = useMemo(() => {
    if (!data) return 0;
    const end =
      new Date(data.attempt.started_at).getTime() + data.test.duration_minutes * 60_000;
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [data, now]);

  // auto-submit when timer expires
  useEffect(() => {
    if (!data || data.attempt.status !== "in_progress") return;
    if (remainingSec === 0 && !submit.isPending && !submit.isSuccess) {
      submit.mutate();
    }
  }, [remainingSec, data, submit]);

  async function persistAnswer(questionId: string, selected: number | null, marked: boolean) {
    queryClient.setQueryData<LoadedAttempt | null>(["attempt", attemptId], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: { selected_index: selected, is_marked: marked },
        },
      };
    });
    const { error } = await supabase
      .from("attempt_answers")
      .upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_index: selected,
          is_marked: marked,
        },
        { onConflict: "attempt_id,question_id" },
      );
    if (error) toast.error("Failed to save answer");
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading test…
      </div>
    );
  }
  if (!data) return <Card className="p-8 text-center">Attempt not found.</Card>;

  if (data.attempt.status !== "in_progress") {
    return (
      <Card className="border-border/60 bg-card/40 p-8 text-center">
        <p className="text-sm">This attempt has been submitted.</p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/results/$attemptId", params: { attemptId } })}
        >
          View results
        </Button>
      </Card>
    );
  }

  const current = data.questions[index];
  const currentAns = data.answers[current.id];
  const options = (current.options as Array<unknown>) ?? [];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur sm:rounded-lg sm:border sm:bg-card/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="line-clamp-1 text-sm font-semibold sm:text-base">{data.test.title}</h1>
            <p className="text-xs text-muted-foreground">
              Question {index + 1} of {data.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1 text-sm font-mono font-semibold",
                remainingSec < 60 && "border-destructive/60 text-destructive",
              )}
            >
              <Clock className="h-3.5 w-3.5" /> {formatSeconds(remainingSec)}
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("Submit test now?")) submit.mutate();
              }}
              disabled={submit.isPending}
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        {/* Question card */}
        <Card className="border-border/60 bg-card/40 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Q{current.position}</Badge>
            <Badge variant="outline" className="text-[10px]">+{current.marks} / -{current.negative_marks}</Badge>
            {currentAns?.is_marked && (
              <Badge className="bg-warning/20 text-warning" variant="secondary">
                <Bookmark className="mr-1 h-3 w-3" /> Marked
              </Badge>
            )}
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{localize(current.question, lang)}</p>

          <div className="mt-5 space-y-2">
            {options.map((opt, i) => {
              const selected = currentAns?.selected_index === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => persistAnswer(current.id, selected ? null : i, currentAns?.is_marked ?? false)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/40 hover:bg-accent/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{localize(opt, lang)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => persistAnswer(current.id, currentAns?.selected_index ?? null, !(currentAns?.is_marked ?? false))}
            >
              <Flag className="mr-1 h-4 w-4" /> {currentAns?.is_marked ? "Unmark" : "Mark for review"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => persistAnswer(current.id, null, currentAns?.is_marked ?? false)}
            >
              Clear
            </Button>
            <div className="grow" />
            <Button
              size="sm"
              disabled={index === data.questions.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Question palette */}
        <Card className="h-fit border-border/60 bg-card/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Questions
          </h3>
          <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {data.questions.map((q, i) => {
              const a = data.answers[q.id];
              const answered = a?.selected_index !== null && a?.selected_index !== undefined;
              const marked = a?.is_marked;
              return (
                <button
                  key={q.id}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-8 w-8 rounded-md border text-xs font-semibold transition-colors",
                    i === index && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    marked
                      ? "border-warning bg-warning/20 text-warning-foreground"
                      : answered
                        ? "border-success bg-success/20 text-success"
                        : "border-border bg-background/40 text-muted-foreground",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
            <Legend className="bg-success/20 border-success" label="Answered" />
            <Legend className="bg-warning/20 border-warning" label="Marked" />
            <Legend className="bg-background/40 border-border" label="Not visited" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-3 w-3 rounded border", className)} /> {label}
    </div>
  );
}
