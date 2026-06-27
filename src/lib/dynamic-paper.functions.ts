import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ attemptId: z.string().uuid() });

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Lang = { en: string; bn?: string; hi?: string };
type AIQuestion = {
  question: Lang;
  options: Lang[];
  correct_index: number;
  explanation?: Lang;
};
type SectionCfg = { subject_slug: string; count: number; label?: string };
type Pattern = {
  total_questions: number;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  sections: SectionCfg[];
};
type TargetExam =
  | "ssc_cgl"
  | "ssc_chsl"
  | "wbcs"
  | "wbpsc"
  | "railway"
  | "banking"
  | "police"
  | "other";

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
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
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

function buildPrompt(args: {
  examName: string;
  syllabus: string;
  subjectLabel: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
  avoidStems: string[];
}) {
  const avoidBlock = args.avoidStems.length
    ? `\nDo NOT repeat or paraphrase any of these recent question stems:\n${args.avoidStems
        .slice(0, 30)
        .map((s, i) => `${i + 1}. ${s.slice(0, 140)}`)
        .join("\n")}`
    : "";
  return `You are an expert question setter for the ${args.examName} examination in India.

Generate exactly ${args.count} ORIGINAL multiple-choice questions for the section "${args.subjectLabel}" at difficulty: ${args.difficulty}.

Ground the questions in the official syllabus below:
---
${args.syllabus}
---
${avoidBlock}

Rules:
- Each question has EXACTLY 4 options. correct_index is 0-based.
- Provide question, all 4 options, and explanation in English (en), Bengali (bn), Hindi (hi).
- Difficulty "${args.difficulty}": easy = direct recall, medium = application, hard = multi-step reasoning.
- Real-exam quality. No "all of the above". No duplicates.
- Output ONLY a valid JSON array, no markdown or commentary.

Format:
[{"question":{"en":"...","bn":"...","hi":"..."},"options":[{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."},{"en":"...","bn":"...","hi":"..."}],"correct_index":0,"explanation":{"en":"...","bn":"...","hi":"..."}}]`;
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
    if (res.status === 429) throw new Error("AI rate limit hit. Try again in a moment.");
    if (res.status === 402)
      throw new Error("Workspace AI credits exhausted. Add credits in Lovable settings.");
    throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonArray(content);
  return parsed.map(validateQuestion).filter((q): q is AIQuestion => q !== null);
}

export const generateDynamicPaperForAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Attempt
    const { data: attempt, error: aErr } = await supabase
      .from("test_attempts")
      .select("id, user_id, test_id")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");

    // 2. Idempotent: if already generated, return
    const { count: existing } = await supabase
      .from("attempt_questions")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attempt.id);
    if ((existing ?? 0) > 0) return { generated: 0, total: existing, aiCalls: 0 };

    // 3. Test + pattern (prefer test.section_config, fallback to exam syllabus)
    const { data: test, error: tErr } = await supabase
      .from("mock_tests")
      .select("id, target_exam, section_config, negative_marks")
      .eq("id", attempt.test_id)
      .single();
    if (tErr) throw new Error(tErr.message);

    let pattern = test.section_config as Pattern | null;
    const { data: syllabusRow, error: syErr } = await supabase
      .from("exam_syllabi")
      .select("name, syllabus, pattern")
      .eq("target_exam", test.target_exam)
      .maybeSingle();
    if (syErr) throw new Error(syErr.message);
    if (!pattern) pattern = (syllabusRow?.pattern as Pattern | null) ?? null;
    if (!pattern || !pattern.sections?.length) {
      throw new Error(
        "No exam pattern available. An admin must configure the syllabus for this exam.",
      );
    }
    const examName = syllabusRow?.name ?? String(test.target_exam).toUpperCase();
    const syllabusText = syllabusRow?.syllabus ?? "(syllabus not provided)";

    // 4. Subjects map
    const slugs = pattern.sections.map((s) => s.subject_slug);
    const { data: subjects, error: sErr } = await supabase
      .from("subjects")
      .select("id, slug, name")
      .in("slug", slugs);
    if (sErr) throw new Error(sErr.message);
    const slugToSubject = new Map((subjects ?? []).map((s) => [s.slug, s]));

    // 5. User history (recent seen)
    const { data: history } = await supabase
      .from("user_question_history")
      .select("question_id")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(5000);
    const seenIds = new Set((history ?? []).map((h) => h.question_id));

    // 6. Pool questions globally to bias AI prompts away from existing stems
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const picked: Array<{
      question_id: string;
      options: unknown[];
      section_label: string;
    }> = [];
    let aiCalls = 0;

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

        // a) Try unseen approved questions first
        const { data: pool } = await supabase
          .from("questions")
          .select("id, options, question")
          .eq("target_exam", test.target_exam)
          .eq("subject_id", subject.id)
          .eq("difficulty", difficulty)
          .eq("status", "approved")
          .eq("is_published", true)
          .limit(500);
        const candidates = pool ?? [];
        const unseen = candidates.filter((c) => !seenIds.has(c.id));
        const take = shuffle(unseen).slice(0, needed);

        for (const q of take) {
          picked.push({
            question_id: q.id,
            options: (q.options as unknown[]) ?? [],
            section_label: section.label ?? subject.name,
          });
        }

        // b) Top up with AI if short
        const short = needed - take.length;
        if (short > 0) {
          // avoid stems = recent question texts in this bucket
          const avoidStems = candidates
            .slice(0, 30)
            .map((c) => {
              const qj = c.question as { en?: string } | null;
              return qj?.en ?? "";
            })
            .filter(Boolean);

          let toGenerate = short;
          let attempts = 0;
          while (toGenerate > 0 && attempts < 2) {
            attempts++;
            const batch = Math.min(toGenerate, 10);
            try {
              aiCalls++;
              const generated = await callAI(
                apiKey,
                buildPrompt({
                  examName,
                  syllabus: syllabusText,
                  subjectLabel: section.label ?? subject.name,
                  difficulty,
                  count: batch,
                  avoidStems,
                }),
              );
              if (generated.length === 0) break;
              const rows = generated.map((q) => ({
                subject_id: subject.id,
                target_exam: test.target_exam as TargetExam,
                difficulty,
                question: q.question,
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation ?? null,
                is_published: true,
                status: "approved" as const,
                ai_generated: true,
                created_by: userId,
                reviewed_by: userId,
                reviewed_at: new Date().toISOString(),
              }));
              const { data: inserted, error: insErr } = await supabase
                .from("questions")
                .insert(rows)
                .select("id, options");
              if (insErr) throw new Error(insErr.message);
              for (const q of inserted ?? []) {
                picked.push({
                  question_id: q.id,
                  options: (q.options as unknown[]) ?? [],
                  section_label: section.label ?? subject.name,
                });
                toGenerate--;
              }
            } catch (e) {
              // If AI fails, fall back: pull from seen pool of same difficulty
              const seenPool = shuffle(candidates.filter((c) => seenIds.has(c.id)));
              const filler = seenPool.slice(0, toGenerate);
              for (const q of filler) {
                picked.push({
                  question_id: q.id,
                  options: (q.options as unknown[]) ?? [],
                  section_label: section.label ?? subject.name,
                });
              }
              toGenerate = 0;
              if (picked.length === 0) {
                throw new Error(
                  `AI generation failed and no fallback questions available: ${
                    e instanceof Error ? e.message : String(e)
                  }`,
                );
              }
              break;
            }
          }
        }
      }
    }

    if (picked.length === 0) {
      throw new Error("Could not assemble a paper. Please try again.");
    }

    // 7. Insert attempt_questions with shuffled options
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

    // 8. Update user history
    const historyRows = picked.map((p) => ({
      user_id: userId,
      question_id: p.question_id,
      times_seen: 1,
      last_seen_at: new Date().toISOString(),
    }));
    await supabase
      .from("user_question_history")
      .upsert(historyRows, { onConflict: "user_id,question_id", ignoreDuplicates: false });

    await supabase
      .from("test_attempts")
      .update({ total_marks: rows.length })
      .eq("id", attempt.id);

    return { generated: rows.length, total: rows.length, aiCalls };
  });
