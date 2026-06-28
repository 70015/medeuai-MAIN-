import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const POOL_TARGET = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type SectionCfg = { subject_slug: string; count: number; label?: string };
type Pattern = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};

function splitByDifficulty(total: number, dist: Pattern["difficulty_distribution"]) {
  const easy = Math.round(total * dist.easy);
  const hard = Math.round(total * dist.hard);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

type PooledQuestion = {
  question_id: string;
  position: number;
  options_order: number[];
  marks: number;
  negative_marks: number;
  section_label: string;
};

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
    let source: "ready" | "reuse" = "ready";
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

    if (!paper) {
      return { claimed: false, source: "empty" as const, total: 0 };
    }

    const questions = paper.questions as PooledQuestion[];
    if (!Array.isArray(questions) || questions.length === 0) {
      return { claimed: false, source: "empty" as const, total: 0 };
    }

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
    const updates: Record<string, unknown> = {
      status: "used",
      times_served: paper.times_served + 1,
      last_served_at: now,
    };
    if (source === "ready") updates.first_served_at = now;
    await supabase.from("paper_pool").update(updates).eq("id", paper.id);

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

// ============================================
// REFILL: build papers from approved bank (fast, no AI calls)
// ============================================
async function buildPaperFromBank(
  supabase: Awaited<ReturnType<typeof import("@/integrations/supabase/auth-middleware").requireSupabaseAuth.execute>>["supabase"] extends infer S ? S : never,
  testId: string,
): Promise<PooledQuestion[] | null> {
  // Resolve test + pattern
  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, target_exam, section_config, negative_marks")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return null;
  let pattern = test.section_config as Pattern | null;
  if (!pattern) {
    const { data: syl } = await supabase
      .from("exam_syllabi")
      .select("pattern")
      .eq("target_exam", test.target_exam)
      .maybeSingle();
    pattern = (syl?.pattern as Pattern | null) ?? null;
  }
  if (!pattern || !pattern.sections?.length) return null;

  const slugs = pattern.sections.map((s) => s.subject_slug);
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .in("slug", slugs);
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
      const { data: pool } = await supabase
        .from("questions")
        .select("id, options")
        .eq("target_exam", test.target_exam)
        .eq("subject_id", subject.id)
        .eq("difficulty", difficulty)
        .eq("status", "approved")
        .eq("is_published", true)
        .limit(500);

      let take = shuffle(pool ?? []).slice(0, needed);
      if (take.length < needed) {
        // top up with any difficulty in the subject
        const { data: extra } = await supabase
          .from("questions")
          .select("id, options")
          .eq("target_exam", test.target_exam)
          .eq("subject_id", subject.id)
          .eq("status", "approved")
          .eq("is_published", true)
          .limit(500);
        const have = new Set(take.map((t) => t.id));
        const more = shuffle((extra ?? []).filter((e) => !have.has(e.id))).slice(0, needed - take.length);
        take = [...take, ...more];
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

export const refillPaperPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ testId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Authorize: admin only
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // Pick tests to refill
    let tests: Array<{ id: string }> = [];
    if (data.testId) {
      tests = [{ id: data.testId }];
    } else {
      const { data: all } = await supabase
        .from("mock_tests")
        .select("id")
        .eq("is_published", true);
      tests = all ?? [];
    }

    let createdTotal = 0;
    const perTest: Array<{ testId: string; created: number; ready: number }> = [];

    for (const t of tests) {
      const { count: readyCount } = await supabase
        .from("paper_pool")
        .select("id", { count: "exact", head: true })
        .eq("test_id", t.id)
        .eq("status", "ready");

      const needed = Math.max(0, POOL_TARGET - (readyCount ?? 0));
      let created = 0;
      for (let i = 0; i < needed; i++) {
        const paper = await buildPaperFromBank(supabase, t.id);
        if (!paper) break;
        const { error } = await supabase
          .from("paper_pool")
          .insert({ test_id: t.id, questions: paper, status: "ready" });
        if (error) break;
        created++;
        createdTotal++;
      }
      perTest.push({ testId: t.id, created, ready: (readyCount ?? 0) + created });
    }

    return { createdTotal, perTest };
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
