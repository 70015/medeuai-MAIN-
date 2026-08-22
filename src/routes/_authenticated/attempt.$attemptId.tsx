import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/app-shell";
import { formatSeconds, localize, type Lang } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attempt/$attemptId")({
  head: () => ({ meta: [{ title: "Test in progress | MedEu.Ai" }] }),
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
    options: unknown[];
    options_order: number[];
    section_label: string | null;
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
  const [paletteOpen, setPaletteOpen] = useState(false);

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

      const { data: aq, error: qErr } = await supabase
        .from("attempt_questions")
        .select(
          "position, marks, negative_marks, options_order, section_label, questions:question_id (id, question, options)",
        )
        .eq("attempt_id", attempt.id)
        .order("position");
      if (qErr) throw qErr;

      const questions = (aq ?? []).map((r) => {
        const q = r.questions as { id: string; question: unknown; options: unknown[] };
        return {
          id: q.id,
          position: r.position,
          marks: Number(r.marks),
          negative_marks: Number(r.negative_marks),
          question: q.question,
          options: q.options ?? [],
          options_order: (r.options_order as number[]) ?? q.options.map((_, i) => i),
          section_label: r.section_label,
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
      // Scoring happens server-side via a SECURITY DEFINER function.
      // The client is not trusted with correct_index or awarded_marks.
      const { error } = await supabase.rpc("submit_attempt", {
        p_attempt_id: data.attempt.id,
      });
      if (error) throw error;
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
  if (!data) return <div className="rounded-xl border border-border p-8 text-center">Attempt not found.</div>;

  if (data.attempt.status !== "in_progress") {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <p className="text-sm">This attempt has been submitted.</p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/results/$attemptId", params: { attemptId } })}
        >
          View results
        </Button>
      </div>
    );
  }

  const current = data.questions[index];
  const currentAns = data.answers[current.id];
  const options = (current.options as Array<unknown>) ?? [];
  const order = current.options_order;
  // Find display position of the currently selected (original) index, if any
  const selectedDisplayIdx =
    currentAns?.selected_index == null ? -1 : order.indexOf(currentAns.selected_index);
  const answeredCount = data.questions.filter((q) => {
    const a = data.answers[q.id];
    return a?.selected_index !== null && a?.selected_index !== undefined;
  }).length;
  const progressPct = Math.round((answeredCount / Math.max(1, data.questions.length)) * 100);

  return (
    <div className="pb-28 lg:pb-4">
      {/* Exam bar */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 pb-2 pt-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Question {index + 1} of {data.questions.length}
              {current.section_label ? ` · ${current.section_label}` : ""}
            </p>
            <h1 className="line-clamp-1 text-sm font-semibold sm:text-base">{data.test.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
                remainingSec < 60 && "border-destructive/60 text-destructive",
              )}
              aria-label="Time remaining"
            >
              <Clock className="h-3.5 w-3.5" /> {formatSeconds(remainingSec)}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="lg:hidden"
              onClick={() => setPaletteOpen((o) => !o)}
              aria-label="Question navigator"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (confirm("Submit test now?")) submit.mutate();
              }}
              disabled={submit.isPending}
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={data.questions.length}
          />
        </div>
      </div>

      {/* Mobile navigator */}
      {paletteOpen && (
        <div className="mt-4 rounded-xl border border-border p-4 lg:hidden">
          <Palette
            questions={data.questions}
            answers={data.answers}
            index={index}
            onPick={(i) => {
              setIndex(i);
              setPaletteOpen(false);
            }}
          />
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_240px]">
        {/* Question */}
        <div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Q{current.position}</span>
            <span>
              +{current.marks} / -{current.negative_marks}
            </span>
            {currentAns?.is_marked && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Flag className="h-3 w-3" /> Marked for review
              </span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
            {localize(current.question, lang)}
          </p>

          <div className="mt-6 space-y-2.5">
            {order.map((origIdx, displayIdx) => {
              const opt = options[origIdx];
              const selected = displayIdx === selectedDisplayIdx;
              return (
                <button
                  key={displayIdx}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    persistAnswer(
                      current.id,
                      selected ? null : origIdx,
                      currentAns?.is_marked ?? false,
                    )
                  }
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors sm:text-base",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-secondary/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + displayIdx)}
                  </span>
                  <span>{localize(opt, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                persistAnswer(
                  current.id,
                  currentAns?.selected_index ?? null,
                  !(currentAns?.is_marked ?? false),
                )
              }
            >
              <Flag className="mr-1 h-4 w-4" /> {currentAns?.is_marked ? "Unmark" : "Mark for review"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => persistAnswer(current.id, null, currentAns?.is_marked ?? false)}
            >
              Clear response
            </Button>
          </div>

          {/* Prev / Next — desktop inline, mobile sticky */}
          <div className="mt-6 hidden items-center justify-between gap-3 lg:flex">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              disabled={index === data.questions.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop navigator */}
        <aside className="hidden h-fit rounded-xl border border-border p-4 lg:block">
          <Palette
            questions={data.questions}
            answers={data.answers}
            index={index}
            onPick={setIndex}
          />
        </aside>
      </div>

      {/* Mobile bottom nav bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            className="flex-1"
            disabled={index === data.questions.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Palette({
  questions,
  answers,
  index,
  onPick,
}: {
  questions: LoadedAttempt["questions"];
  answers: LoadedAttempt["answers"];
  index: number;
  onPick: (i: number) => void;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Question navigator
      </h3>
      <div className="mt-3 grid grid-cols-8 gap-1.5 lg:grid-cols-5">
        {questions.map((q, i) => {
          const a = answers[q.id];
          const answered = a?.selected_index !== null && a?.selected_index !== undefined;
          const marked = a?.is_marked;
          return (
            <button
              key={q.id}
              onClick={() => onPick(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-8 w-full rounded-md border text-xs font-semibold transition-colors",
                i === index && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                marked
                  ? "border-primary bg-primary/15 text-primary"
                  : answered
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
        <Legend className="bg-primary border-primary" label="Answered" />
        <Legend className="bg-primary/15 border-primary" label="Marked for review" />
        <Legend className="bg-background border-border" label="Not visited" />
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
