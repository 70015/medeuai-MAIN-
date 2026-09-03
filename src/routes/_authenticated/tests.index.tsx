import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, FileText, Target, Trophy } from "lucide-react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/app-shell";
import { examLabel } from "@/lib/exam";
import { cn } from "@/lib/utils";

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
  head: () => ({
    meta: [
      { title: "Practice & Mock Tests | MedEuAi" },
      {
        name: "description",
        content:
          "Practice full-length mock tests for SSC, WBCS, WBPSC, Railway, Banking and Police exams with instant analysis on MedEuAi.",
      },
      { property: "og:title", content: "Practice & Mock Tests | MedEuAi" },
      {
        property: "og:description",
        content: "Exam-serious mock tests with instant scoring, weak-area analysis and AI explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: TestsListPage,
});

type SectionCfg = { subject_slug?: string; label?: string; count?: number };
type Pattern = { total_questions?: number; sections?: SectionCfg[] };

function TestsListPage() {
  const { exam } = Route.useSearch();
  const { data: profile } = useProfile();

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

  const { data: syllabi } = useQuery({
    queryKey: ["exam-syllabi", "subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_syllabi")
        .select("target_exam, pattern");
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["my-attempts", "practice-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("id, test_id, status, accuracy, submitted_at")
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const subjectsByExam = new Map<string, string[]>();
  (syllabi ?? []).forEach((s) => {
    const p = (s.pattern ?? null) as Pattern | null;
    const labels = (p?.sections ?? [])
      .map((sec) => sec.label ?? sec.subject_slug ?? "")
      .filter(Boolean);
    if (labels.length) subjectsByExam.set(s.target_exam, labels);
  });

  const testsById = new Map((tests ?? []).map((t) => [t.id, t]));
  const attemptsByExam = new Map<string, number>();
  (attempts ?? []).forEach((a) => {
    const t = testsById.get(a.test_id);
    if (!t) return;
    attemptsByExam.set(t.target_exam, (attemptsByExam.get(t.target_exam) ?? 0) + 1);
  });

  const groups = EXAM_CODES.filter((c) => c !== "all").map((code) => {
    const list = (tests ?? []).filter((t) => t.target_exam === code);
    return {
      code,
      tests: list,
      subjects: subjectsByExam.get(code) ?? [],
      attempted: attemptsByExam.get(code) ?? 0,
    };
  });

  const visibleGroups = exam === "all" ? groups.filter((g) => g.tests.length > 0) : groups.filter((g) => g.code === exam);

  // Recommended test: prefer the user's target exam, then the first unattempted paper.
  const attemptedTestIds = new Set((attempts ?? []).map((a) => a.test_id));
  const pool = tests ?? [];
  const recommended =
    pool.find((t) => t.target_exam === profile?.target_exam && !attemptedTestIds.has(t.id)) ??
    pool.find((t) => t.target_exam === profile?.target_exam) ??
    pool.find((t) => !attemptedTestIds.has(t.id)) ??
    pool[0];
  const recommendedReason = !recommended
    ? ""
    : recommended.target_exam === profile?.target_exam
      ? attemptedTestIds.has(recommended.id)
        ? `Matches your target exam, ${examLabel(recommended.target_exam)}.`
        : `New paper for your target exam, ${examLabel(recommended.target_exam)}.`
      : profile?.target_exam
        ? "A good warm-up while more papers for your target exam are added."
        : "Set your target exam in Profile and this gets sharper.";

  return (
    <div className="space-y-10 pb-4">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Practice</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          What are you preparing for?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick your exam and practise under real exam conditions. Every paper is scored instantly
          with a full breakdown.
        </p>
      </header>

      {/* Recommended test */}
      {recommended && (
        <section className="rounded-xl bg-[#04211C] dark:bg-card dark:border dark:border-border p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            <Target className="h-3.5 w-3.5" /> Recommended for you
          </div>
          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">{recommended.title}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">{recommendedReason}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span>{examLabel(recommended.target_exam)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {recommended.duration_minutes} min
            </span>
            <span>{Number(recommended.total_marks)} marks</span>
          </div>
          <div className="mt-6">
            <Link to="/tests/$slug" params={{ slug: recommended.slug }}>
              <Button size="lg" className="bg-white text-[#04211C] hover:bg-white/90">
                Start this test <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Exam filter */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {EXAM_CODES.map((code) => {
            const active = exam === code;
            return (
              <Link
                key={code}
                to="/tests"
                search={{ exam: code }}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {code === "all" ? "All exams" : examLabel(code)}
              </Link>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {exam === "all"
              ? "No mock tests published yet. New papers are added regularly."
              : `No papers for ${examLabel(exam)} yet. Try another exam.`}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleGroups.map((g) => (
            <section key={g.code}>
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{examLabel(g.code)}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.subjects.length
                      ? g.subjects.join(" · ")
                      : "Subject breakdown will appear once the syllabus is published."}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">
                    {g.tests.length} {g.tests.length === 1 ? "test" : "tests"} available
                  </div>
                  <div>
                    {g.attempted > 0 ? `${g.attempted} attempted by you` : "Not attempted yet"}
                  </div>
                </div>
              </div>

              {g.tests.length === 0 ? (
                <p className="pt-4 text-sm text-muted-foreground">No papers here yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {g.tests.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{t.title}</h3>
                          {t.is_free && (
                            <Badge variant="secondary" className="text-[10px]">
                              Free
                            </Badge>
                          )}
                          {attemptedTestIds.has(t.id) && (
                            <Badge variant="outline" className="text-[10px]">
                              Attempted
                            </Badge>
                          )}
                        </div>
                        {t.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="capitalize">{t.test_type.replace("_", " ")}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {t.duration_minutes} min
                          </span>
                          <span>{Number(t.total_marks)} marks</span>
                        </div>
                      </div>
                      <Link to="/tests/$slug" params={{ slug: t.slug }} className="shrink-0">
                        <Button size="sm" variant="outline">
                          View details <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-6">
        <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <Trophy className="h-4 w-4" /> See how you rank on the leaderboard
        </Link>
      </div>
    </div>
  );
}
