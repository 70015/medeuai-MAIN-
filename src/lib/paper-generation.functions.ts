import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SectionCfg = {
  subject_slug: string;
  count: number;
  label?: string;
};
type TestConfig = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitByDifficulty(total: number, dist: TestConfig["difficulty_distribution"]) {
  const easy = Math.round(total * dist.easy);
  const hard = Math.round(total * dist.hard);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

const Input = z.object({ attemptId: z.string().uuid() });

export const generatePaperForAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Attempt + test
    const { data: attempt, error: aErr } = await supabase
      .from("test_attempts")
      .select("id, user_id, test_id")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");

    // 2. If already has attempt_questions, return
    const { count: existing } = await supabase
      .from("attempt_questions")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attempt.id);
    if ((existing ?? 0) > 0) return { generated: 0, total: existing };

    const { data: test, error: tErr } = await supabase
      .from("mock_tests")
      .select("id, target_exam, section_config, is_dynamic, negative_marks")
      .eq("id", attempt.test_id)
      .single();
    if (tErr) throw new Error(tErr.message);

    const cfg = test.section_config as TestConfig | null;

    // Fallback legacy path: copy from mock_test_questions
    if (!test.is_dynamic || !cfg) {
      const { data: legacy, error: lErr } = await supabase
        .from("mock_test_questions")
        .select("position, marks, negative_marks, question_id, questions:question_id (options)")
        .eq("test_id", test.id)
        .order("position");
      if (lErr) throw new Error(lErr.message);
      if (!legacy || legacy.length === 0) throw new Error("No questions configured for this test");
      const rows = legacy.map((r) => {
        const opts = ((r.questions as { options: unknown[] } | null)?.options ?? []) as unknown[];
        const order = shuffle(opts.map((_, i) => i));
        return {
          attempt_id: attempt.id,
          question_id: r.question_id,
          position: r.position,
          options_order: order,
          marks: r.marks,
          negative_marks: r.negative_marks,
        };
      });
      const { error: insErr } = await supabase.from("attempt_questions").insert(rows);
      if (insErr) throw new Error(insErr.message);
      return { generated: rows.length, total: rows.length };
    }

    // 3. Resolve subjects
    const slugs = cfg.sections.map((s) => s.subject_slug);
    const { data: subjects, error: sErr } = await supabase
      .from("subjects")
      .select("id, slug")
      .in("slug", slugs);
    if (sErr) throw new Error(sErr.message);
    const slugToId = new Map((subjects ?? []).map((s) => [s.slug, s.id]));

    // 4. Fetch user history (limit recent 5000)
    const { data: history } = await supabase
      .from("user_question_history")
      .select("question_id")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(5000);
    const seenIds = new Set((history ?? []).map((h) => h.question_id));

    // 5. For each section + difficulty bucket, pick questions
    const picked: Array<{
      question_id: string;
      options: unknown[];
      section_label: string;
    }> = [];

    for (const section of cfg.sections) {
      const subjectId = slugToId.get(section.subject_slug);
      if (!subjectId) continue;
      const buckets = splitByDifficulty(section.count, cfg.difficulty_distribution);
      for (const [difficulty, count] of [
        ["easy", buckets.easy],
        ["medium", buckets.medium],
        ["hard", buckets.hard],
      ] as Array<["easy" | "medium" | "hard", number]>) {
        if (count <= 0) continue;
        // Fetch a larger candidate pool for this bucket
        const { data: pool, error: pErr } = await supabase
          .from("questions")
          .select("id, options")
          .eq("target_exam", test.target_exam)
          .eq("subject_id", subjectId)
          .eq("difficulty", difficulty)
          .eq("status", "approved")
          .eq("is_published", true)
          .limit(500);
        if (pErr) throw new Error(pErr.message);
        const candidates = pool ?? [];
        // Prefer unseen
        const unseen = candidates.filter((c) => !seenIds.has(c.id));
        const seen = candidates.filter((c) => seenIds.has(c.id));
        const ordered = [...shuffle(unseen), ...shuffle(seen)];
        const take = ordered.slice(0, count);
        // If pool insufficient, fall back to any difficulty in this subject
        if (take.length < count) {
          const { data: extra } = await supabase
            .from("questions")
            .select("id, options")
            .eq("target_exam", test.target_exam)
            .eq("subject_id", subjectId)
            .eq("status", "approved")
            .eq("is_published", true)
            .limit(500);
          const existingIds = new Set(take.map((t) => t.id));
          const more = shuffle(
            (extra ?? []).filter((e) => !existingIds.has(e.id)),
          ).slice(0, count - take.length);
          take.push(...more);
        }
        for (const q of take) {
          picked.push({
            question_id: q.id,
            options: (q.options as unknown[]) ?? [],
            section_label: section.label ?? section.subject_slug,
          });
        }
      }
    }

    if (picked.length === 0) {
      throw new Error(
        "Question bank is empty for this test. An admin needs to add or generate questions first.",
      );
    }

    // 6. Insert attempt_questions
    const rows = picked.map((p, idx) => ({
      attempt_id: attempt.id,
      question_id: p.question_id,
      position: idx + 1,
      options_order: shuffle(p.options.map((_, i) => i)),
      marks: 1,
      negative_marks: Number(test.negative_marks) || 0,
      section_label: p.section_label,
    }));
    const { error: insErr } = await supabase.from("attempt_questions").insert(rows);
    if (insErr) throw new Error(insErr.message);

    // 7. Update user history (best effort)
    const historyRows = picked.map((p) => ({
      user_id: userId,
      question_id: p.question_id,
      times_seen: 1,
      last_seen_at: new Date().toISOString(),
    }));
    // Upsert with increment via separate updates would need RPC; for now insert-ignore via upsert
    await supabase
      .from("user_question_history")
      .upsert(historyRows, { onConflict: "user_id,question_id", ignoreDuplicates: false });

    // Also update total_marks on attempt to match generated paper
    await supabase
      .from("test_attempts")
      .update({ total_marks: rows.length })
      .eq("id", attempt.id);

    return { generated: rows.length, total: rows.length };
  });
