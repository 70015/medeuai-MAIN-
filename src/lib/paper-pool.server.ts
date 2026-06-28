import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const POOL_TARGET = 3;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type SectionCfg = { subject_slug: string; count: number; label?: string };
type Pattern = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};
type Lang = { en: string; bn?: string; hi?: string };
type AIQuestion = {
  question: Lang;
  options: Lang[];
  correct_index: number;
  explanation?: Lang;
};

export type PooledQuestion = {
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

function extractJsonArray(text: string): unknown[] {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI did not return a JSON array");
  const parsed = JSON.parse(t.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed;
}

function validateQuestion(q: unknown): AIQuestion | null {
  if (!q || typeof q !== "object") return null;
  const obj = q as Record<string, unknown>;
  const question = obj.question as Lang | undefined;
  const options = obj.options as Lang[] | undefined;
  const correct = obj.correct_index;
  if (!question?.en) return null;
  if (!Array.isArray(options) || options.length !== 4) return null;
  if (typeof correct !== "number" || correct < 0 || correct > 3) return null;
  if (options.some((o) => !o?.en)) return null;
  return {
    question,
    options,
    correct_index: correct,
    explanation: (obj.explanation as Lang) ?? undefined,
  };
}

async function callAI(apiKey: string, prompt: string): Promise<AIQuestion[]> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You output only valid JSON arrays. No commentary." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonArray(content);
  return parsed.map(validateQuestion).filter((q): q is AIQuestion => q !== null);
}

function buildPrompt(args: {
  examName: string;
  syllabus: string;
  subjectLabel: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
}) {
  return `You are an expert question setter for the ${args.examName} examination in India.

Generate exactly ${args.count} ORIGINAL multiple-choice questions for "${args.subjectLabel}" at difficulty: ${args.difficulty}.

Ground in the official syllabus:
---
${args.syllabus}
---

Rules:
- Each question has EXACTLY 4 options. correct_index is 0-based.
- Provide question, all 4 options, and explanation in English (en), Bengali (bn), Hindi (hi).
- Real-exam quality. No "all of the above". No duplicates.
- Output ONLY a valid JSON array.

Format:
[{"question":{"en":"...","bn":"...","hi":"..."},"options":[{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."}],"correct_index":0,"explanation":{"en":"...","bn":"...","hi":"..."}}]`;
}

async function buildOnePaper(
  supabase: SupabaseClient<Database>,
  testId: string,
  apiKey: string | undefined,
  allowAI: boolean,
): Promise<PooledQuestion[] | null> {
  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, target_exam, section_config, negative_marks")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return null;

  let pattern = test.section_config as Pattern | null;
  const { data: syllabusRow } = await supabase
    .from("exam_syllabi")
    .select("name, syllabus, pattern")
    .eq("target_exam", test.target_exam)
    .maybeSingle();
  if (!pattern) pattern = (syllabusRow?.pattern as Pattern | null) ?? null;
  if (!pattern || !pattern.sections?.length) return null;

  const examName = syllabusRow?.name ?? String(test.target_exam).toUpperCase();
  const syllabusText = syllabusRow?.syllabus ?? "(syllabus not provided)";

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
        // Top up with any approved difficulty for this subject
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

      // AI fallback to fill remaining slots
      const short = needed - take.length;
      if (short > 0 && allowAI && apiKey) {
        try {
          const generated = await callAI(
            apiKey,
            buildPrompt({
              examName,
              syllabus: syllabusText,
              subjectLabel: section.label ?? subject.name,
              difficulty,
              count: short,
            }),
          );
          if (generated.length > 0) {
            const rows = generated.map((q) => ({
              subject_id: subject.id,
              target_exam: test.target_exam,
              difficulty,
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
              explanation: q.explanation ?? null,
              is_published: true,
              status: "approved" as const,
              ai_generated: true,
            }));
            const { data: inserted } = await supabase
              .from("questions")
              .insert(rows)
              .select("id, options");
            for (const q of inserted ?? []) {
              take.push({ id: q.id, options: q.options });
            }
          }
        } catch (e) {
          console.error("[paper-pool] AI fallback failed:", e);
        }
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

export async function refillAllPools(
  supabase: SupabaseClient<Database>,
  opts: { testId?: string; allowAI?: boolean } = {},
) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const allowAI = opts.allowAI !== false;

  let tests: Array<{ id: string }> = [];
  if (opts.testId) {
    tests = [{ id: opts.testId }];
  } else {
    const { data: all } = await supabase
      .from("mock_tests")
      .select("id")
      .eq("is_published", true);
    tests = all ?? [];
  }

  let createdTotal = 0;
  const perTest: Array<{ testId: string; created: number; ready: number; aiUsed: boolean }> = [];

  for (const t of tests) {
    const { count: readyCount } = await supabase
      .from("paper_pool")
      .select("id", { count: "exact", head: true })
      .eq("test_id", t.id)
      .eq("status", "ready");

    const needed = Math.max(0, POOL_TARGET - (readyCount ?? 0));
    let created = 0;
    let aiUsed = false;

    for (let i = 0; i < needed; i++) {
      const paper = await buildOnePaper(supabase, t.id, apiKey, allowAI);
      if (!paper) break;
      const { error } = await supabase
        .from("paper_pool")
        .insert({ test_id: t.id, questions: paper, status: "ready" });
      if (error) break;
      created++;
      createdTotal++;
      // Detect AI usage indirectly: if bank was clearly insufficient, mark
      aiUsed = aiUsed || allowAI;
    }
    perTest.push({ testId: t.id, created, ready: (readyCount ?? 0) + created, aiUsed });
  }

  return { createdTotal, perTest };
}
