import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SectionCfg = { subject_slug: string; count: number; label?: string };
type Pattern = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};

type PooledQuestion = {
  question_id: string;
  position: number;
  options_order: number[];
  marks: number;
  negative_marks: number;
  section_label: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitByDifficulty(total: number, dist: Pattern["difficulty_distribution"]) {
  const easy = Math.round(total * dist.easy);
  const hard = Math.round(total * dist.hard);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

async function buildInstantBankPaper(
  supabase: SupabaseClient<Database>,
  testId: string,
): Promise<PooledQuestion[] | null> {
  const { data: test, error: tErr } = await supabase
    .from("mock_tests")
    .select("id, target_exam, section_config, negative_marks")
    .eq("id", testId)
    .maybeSingle();
  if (tErr) throw new Error(tErr.message);
  if (!test) return null;

  let pattern = test.section_config as Pattern | null;
  if (!pattern) {
    const { data: syllabusRow, error: syErr } = await supabase
      .from("exam_syllabi")
      .select("pattern")
      .eq("target_exam", test.target_exam)
      .maybeSingle();
    if (syErr) throw new Error(syErr.message);
    pattern = (syllabusRow?.pattern as Pattern | null) ?? null;
  }
  if (!pattern || !pattern.sections?.length) return null;

  const slugs = pattern.sections.map((s) => s.subject_slug);
  const { data: subjects, error: sErr } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .in("slug", slugs);
  if (sErr) throw new Error(sErr.message);
  const slugToSubject = new Map((subjects ?? []).map((s) => [s.slug, s]));

  const picked: PooledQuestion[] = [];
  let position = 1;

  for (const section of pattern.sections) {
    const subject = slugToSubject.get(section.subject_slug);
    if (!subject) continue;
    const buckets = splitByDifficulty(section.count, pattern.difficulty_distribution);

    for (const [difficulty, needed] of [
      ["easy", buckets.easy],
      ["medium", buckets.medium],
      ["hard", buckets.hard],
    ] as Array<["easy" | "medium" | "hard", number]>) {
      if (needed <= 0) continue;

      const { data: exact, error: qErr } = await supabase
        .from("questions")
        .select("id, options")
        .eq("target_exam", test.target_exam)
        .eq("subject_id", subject.id)
        .eq("difficulty", difficulty)
        .eq("status", "approved")
        .eq("is_published", true)
        .limit(500);
      if (qErr) throw new Error(qErr.message);

      let take = shuffle(exact ?? []).slice(0, needed);
      if (take.length < needed) {
        const have = new Set(take.map((q) => q.id));
        const { data: extra, error: exErr } = await supabase
          .from("questions")
          .select("id, options")
          .eq("target_exam", test.target_exam)
          .eq("subject_id", subject.id)
          .eq("status", "approved")
          .eq("is_published", true)
          .limit(500);
        if (exErr) throw new Error(exErr.message);
        take = [
          ...take,
          ...shuffle((extra ?? []).filter((q) => !have.has(q.id))).slice(0, needed - take.length),
        ];
      }

      for (const q of take) {
        const opts = (q.options as unknown[]) ?? [];
        picked.push({
          question_id: q.id,
          position: position++,
          options_order: shuffle(opts.map((_, i) => i)),
          marks: 1,
          negative_marks: Number(test.negative_marks) || 0,
          section_label: section.label ?? subject.name,
        });
      }
    }
  }

  return picked.length > 0 ? picked : null;
}


// ============================================
// CLAIM: serve a ready paper to an attempt INSTANTLY
// ============================================
export const claimPaperForAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attemptId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: attempt, error: aErr } = await supabase
      .from("test_attempts")
      .select("id, user_id, test_id")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");

    // Idempotent
    const { count: existing } = await supabase
      .from("attempt_questions")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attempt.id);
    if ((existing ?? 0) > 0) {
      return { claimed: false, source: "existing" as const, total: existing ?? 0 };
    }

    // 1. Try oldest READY paper
    let paper: { id: string; questions: unknown; times_served: number } | null = null;
    let source: "ready" | "reuse" | "bank" = "ready";
    const { data: readyPaper } = await supabase
      .from("paper_pool")
      .select("id, questions, times_served")
      .eq("test_id", attempt.test_id)
      .eq("status", "ready")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (readyPaper) {
      paper = readyPaper;
    } else {
      // 2. Reuse oldest USED paper
      const { data: reusePaper } = await supabase
        .from("paper_pool")
        .select("id, questions, times_served")
        .eq("test_id", attempt.test_id)
        .eq("status", "used")
        .order("last_served_at", { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();
      if (reusePaper) {
        paper = reusePaper;
        source = "reuse";
      }
    }

    const questions = paper
      ? (paper.questions as PooledQuestion[])
      : await buildInstantBankPaper(supabase, attempt.test_id);
    if (!Array.isArray(questions) || questions.length === 0) {
      return { claimed: false, source: "empty" as const, total: 0 };
    }
    if (!paper) source = "bank";

    const rows = questions.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.question_id,
      position: q.position,
      options_order: q.options_order,
      marks: q.marks,
      negative_marks: q.negative_marks,
      section_label: q.section_label,
    }));

    const { error: insErr } = await supabase.from("attempt_questions").insert(rows);
    if (insErr) throw new Error(insErr.message);

    const now = new Date().toISOString();
    if (source === "ready" && paper) {
      await supabase
        .from("paper_pool")
        .update({
          status: "used",
          times_served: paper.times_served + 1,
          last_served_at: now,
          first_served_at: now,
        })
        .eq("id", paper.id);
    } else if (source === "reuse" && paper) {
      await supabase
        .from("paper_pool")
        .update({
          status: "used",
          times_served: paper.times_served + 1,
          last_served_at: now,
        })
        .eq("id", paper.id);
    } else if (source === "bank") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("paper_pool").insert({
        test_id: attempt.test_id,
        questions,
        status: "used",
        times_served: 1,
        first_served_at: now,
        last_served_at: now,
      });
    }


    // User history (best effort)
    await supabase.from("user_question_history").upsert(
      questions.map((q) => ({
        user_id: userId,
        question_id: q.question_id,
        times_seen: 1,
        last_seen_at: now,
      })),
      { onConflict: "user_id,question_id", ignoreDuplicates: false },
    );

    await supabase
      .from("test_attempts")
      .update({ total_marks: rows.length })
      .eq("id", attempt.id);

    return { claimed: true, source, total: rows.length };
  });

// Refill logic lives in src/lib/paper-pool.server.ts (shared with cron route).


export const refillPaperPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ testId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Use admin client for inserts so background-style AI generation isn't
    // bounded by per-user RLS, and reuse the shared refill helper (bank + AI).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { refillAllPools } = await import("@/lib/paper-pool.server");
    return refillAllPools(supabaseAdmin, { testId: data.testId, allowAI: true });
  });

// ============================================
// STATS: admin dashboard
// ============================================
export const getPoolStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: tests } = await supabase
      .from("mock_tests")
      .select("id, title, target_exam")
      .eq("is_published", true)
      .order("title");

    const { data: pool } = await supabase
      .from("paper_pool")
      .select("test_id, status, times_served");

    const byTest = new Map<string, { ready: number; used: number; serves: number }>();
    for (const p of pool ?? []) {
      const cur = byTest.get(p.test_id) ?? { ready: 0, used: 0, serves: 0 };
      if (p.status === "ready") cur.ready++;
      else cur.used++;
      cur.serves += p.times_served;
      byTest.set(p.test_id, cur);
    }

    return (tests ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      target_exam: t.target_exam,
      ...byTest.get(t.id) ?? { ready: 0, used: 0, serves: 0 },
    }));
  });
