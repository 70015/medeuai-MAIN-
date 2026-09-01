import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { generateAIQuestions } from "@/lib/ai-questions.functions";

export const Route = createFileRoute("/_authenticated/admin/generate")({
  head: () => ({ meta: [{ title: "AI Generate | MedEuAi" }] }),
  component: GeneratePage,
});

const EXAMS = [
  { value: "ssc_chsl", label: "SSC CHSL" },
  { value: "ssc_cgl", label: "SSC CGL" },
  { value: "wbcs", label: "WBCS" },
  { value: "wbpsc", label: "WBPSC" },
  { value: "railway", label: "Railway" },
  { value: "banking", label: "Banking" },
  { value: "police", label: "Police" },
];

function GeneratePage() {
  const queryClient = useQueryClient();
  const fn = useServerFn(generateAIQuestions);

  const [exam, setExam] = useState("ssc_chsl");
  const [subjectSlug, setSubjectSlug] = useState("gk");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("slug, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["ai-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generation_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const gen = useMutation({
    mutationFn: () =>
      fn({
        data: {
          targetExam: exam,
          subjectSlug,
          difficulty,
          count,
          topic: topic.trim() || undefined,
          autoApprove,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Generated ${r.created} questions${r.status === "pending_review" ? ", awaiting review" : ""}`,
      );
      queryClient.invalidateQueries({ queryKey: ["ai-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="border-border/60 bg-card/40 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Generate questions with AI</h2>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam">
              <Select value={exam} onValueChange={setExam}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAMS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subject">
              <Select value={subjectSlug} onValueChange={setSubjectSlug}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(subjects ?? []).map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Count (1-20)">
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              />
            </Field>
          </div>
          <Field label="Topic (optional)">
            <Input
              placeholder="e.g. Indian Constitution, Percentages, Synonyms"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={autoApprove}
              onCheckedChange={(v) => setAutoApprove(v === true)}
            />
            Auto-approve (skip review queue, publish immediately)
          </label>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="w-full">
            {gen.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Generate {count} question{count > 1 ? "s" : ""}
          </Button>
          <p className="text-xs text-muted-foreground">
            Uses Lovable AI Gateway (Gemini). Generation takes ~10-30 seconds per batch.
            For first-time seeding, run several batches across subjects.
          </p>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/40 p-5">
        <h3 className="text-sm font-semibold">Recent jobs</h3>
        <div className="mt-3 space-y-2">
          {(jobs ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No jobs yet.</p>
          )}
          {(jobs ?? []).map((j) => (
            <div
              key={j.id}
              className="rounded-md border border-border/60 bg-background/40 p-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{j.target_exam} · {j.difficulty}</span>
                <span
                  className={
                    j.status === "completed"
                      ? "text-success"
                      : j.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {j.status}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">
                {j.count_created} / {j.count_requested} created
              </div>
              {j.error && (
                <div className="mt-1 line-clamp-2 text-destructive">{j.error}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
