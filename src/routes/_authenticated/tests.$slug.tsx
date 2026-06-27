import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, FileText, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { examLabel } from "@/lib/exam";

export const Route = createFileRoute("/_authenticated/tests/$slug")({
  head: () => ({ meta: [{ title: "Mock Test — ParikshaSathi" }] }),
  component: TestDetailsPage,
});

function TestDetailsPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

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
      const { count } = await supabase
        .from("mock_test_questions")
        .select("id", { count: "exact", head: true })
        .eq("test_id", test.id);
      return { test, questionCount: count ?? 0 };
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      if (!data?.test) throw new Error("Test not loaded");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      // resume in-progress attempt if exists
      const { data: existing } = await supabase
        .from("test_attempts")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("test_id", data.test.id)
        .eq("status", "in_progress")
        .maybeSingle();
      if (existing) return existing.id;
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
      return ins.id;
    },
    onSuccess: (attemptId) => {
      navigate({ to: "/attempt/$attemptId", params: { attemptId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted/40" />;
  }
  if (!data?.test) {
    return (
      <Card className="border-border/60 bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Test not found.</p>
        <Link to="/tests" className="mt-3 inline-block">
          <Button variant="outline" size="sm">Back to tests</Button>
        </Link>
      </Card>
    );
  }
  const t = data.test;

  return (
    <div className="space-y-6">
      <Link to="/tests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> All tests
      </Link>

      <Card className="border-border/60 bg-card/40 p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{examLabel(t.target_exam)}</Badge>
          <Badge variant="outline" className="capitalize">{t.test_type.replace("_", " ")}</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoTile icon={Clock} label="Duration" value={`${t.duration_minutes} min`} />
          <InfoTile icon={FileText} label="Questions" value={`${data.questionCount}`} />
          <InfoTile icon={FileText} label="Marks" value={`${Number(t.total_marks)} (-${Number(t.negative_marks)})`} />
        </div>

        <div className="mt-6 rounded-lg border border-border/60 bg-background/40 p-4">
          <h2 className="text-sm font-semibold">Instructions</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>The test will run for {t.duration_minutes} minutes from the moment you start.</li>
            <li>You can navigate freely between questions and mark them for review.</li>
            <li>Negative marking: -{Number(t.negative_marks)} for each incorrect answer.</li>
            <li>Your progress is saved automatically.</li>
          </ul>
        </div>

        <div className="mt-6">
          <Button size="lg" onClick={() => start.mutate()} disabled={start.isPending || data.questionCount === 0}>
            <PlayCircle className="mr-1.5 h-4 w-4" />
            {start.isPending ? "Starting…" : "Start test"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
