import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { reviewQuestion } from "@/lib/admin.functions";
import { localize } from "@/lib/exam";

export const Route = createFileRoute("/_authenticated/admin/review")({
  head: () => ({ meta: [{ title: "Review Queue — ParikshaSathi" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const qc = useQueryClient();
  const fn = useServerFn(reviewQuestion);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-questions"],
    queryFn: async () => {
      // Uses SECURITY DEFINER RPC — regular users cannot read correct_index
      // from the questions table anymore.
      const { data, error } = await supabase.rpc("admin_pending_questions", {
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        target_exam: r.target_exam,
        difficulty: r.difficulty,
        question: r.q_question,
        options: r.q_options,
        correct_index: r.correct_index,
        explanation: r.explanation,
        ai_generated: r.ai_generated,
        created_at: r.created_at,
        subjects: r.subject_name ? { name: r.subject_name } : null,
      }));
    },
  });

  const review = useMutation({
    mutationFn: (args: { questionId: string; action: "approve" | "reject" }) =>
      fn({ data: args }),
    onSuccess: (_r, args) => {
      toast.success(args.action === "approve" ? "Approved" : "Rejected");
      qc.invalidateQueries({ queryKey: ["pending-questions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );

  if (!data || data.length === 0) {
    return (
      <Card className="border-border/60 bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Nothing to review. 🎉</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((q) => {
        const opts = (q.options as unknown[]) ?? [];
        const subject = (q.subjects as { name: string } | null)?.name ?? "—";
        return (
          <Card key={q.id} className="border-border/60 bg-card/40 p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{q.target_exam}</Badge>
              <Badge variant="outline">{subject}</Badge>
              <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
              {q.ai_generated && (
                <Badge className="bg-primary/15 text-primary" variant="secondary">AI</Badge>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm">{localize(q.question, "english")}</p>
            <div className="mt-3 space-y-1.5">
              {opts.map((o, i) => (
                <div
                  key={i}
                  className={
                    "flex items-start gap-2 rounded-md border px-3 py-2 text-sm " +
                    (i === q.correct_index
                      ? "border-success bg-success/10"
                      : "border-border/60")
                  }
                >
                  <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                  <span className="grow">{localize(o, "english")}</span>
                  {i === q.correct_index && <Check className="h-4 w-4 text-success" />}
                </div>
              ))}
            </div>
            {q.explanation ? (
              <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Explanation: </span>
                {localize(q.explanation, "english")}
              </div>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => review.mutate({ questionId: q.id, action: "approve" })}
                disabled={review.isPending}
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => review.mutate({ questionId: q.id, action: "reject" })}
                disabled={review.isPending}
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
