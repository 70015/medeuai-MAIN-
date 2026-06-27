import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, PlayCircle, Sparkles } from "lucide-react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { examLabel } from "@/lib/exam";

const EXAM_CODES = [
  "all",
  "ssc_cgl",
  "ssc_chsl",
  "wbcs",
  "wbpsc",
  "railway",
  "banking",
  "police",
  "other",
] as const;

const searchSchema = z.object({
  exam: fallback(z.enum(EXAM_CODES), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/tests/")({
  head: () => ({ meta: [{ title: "Question Bank — ParikshaSathi" }] }),
  validateSearch: zodValidator(searchSchema),
  component: TestsListPage,
});

function TestsListPage() {
  const { exam } = Route.useSearch();
  const { data: tests, isLoading } = useQuery({
    queryKey: ["mock-tests", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select(
          "id, slug, title, description, target_exam, test_type, duration_minutes, total_marks, is_free",
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered =
    exam === "all" ? tests ?? [] : (tests ?? []).filter((t) => t.target_exam === exam);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-sm text-muted-foreground">
            Choose an exam to see all available mock papers. Practice under exam conditions.
          </p>
        </div>
        <Link to="/leaderboard">
          <Button variant="outline" size="sm">
            <Sparkles className="mr-1.5 h-4 w-4" /> Leaderboard
          </Button>
        </Link>
      </header>

      {/* Exam filter chips */}
      <div className="flex flex-wrap gap-2">
        {EXAM_CODES.map((code) => {
          const active = exam === code;
          return (
            <Link
              key={code}
              to="/tests"
              search={{ exam: code }}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground")
              }
            >
              {code === "all" ? "All exams" : examLabel(code)}
            </Link>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/40 p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {exam === "all"
              ? "No mock tests published yet."
              : `No papers for ${examLabel(exam)} yet. Try another exam.`}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <Card key={t.id} className="border-border/60 bg-card/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {examLabel(t.target_exam)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {t.test_type.replace("_", " ")}
                    </Badge>
                    {t.is_free && (
                      <Badge className="bg-success/15 text-success text-[10px]" variant="secondary">
                        Free
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold">{t.title}</h3>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {t.duration_minutes} min
                </span>
                <span>{Number(t.total_marks)} marks</span>
              </div>
              <div className="mt-4">
                <Link to="/tests/$slug" params={{ slug: t.slug }}>
                  <Button size="sm">
                    <PlayCircle className="mr-1.5 h-4 w-4" /> View & Start
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
