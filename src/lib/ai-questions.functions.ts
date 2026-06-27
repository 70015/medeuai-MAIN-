import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  targetExam: z.string(),
  subjectSlug: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.number().int().min(1).max(20),
  topic: z.string().optional(),
  autoApprove: z.boolean().optional(),
});

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type AIQuestion = {
  question: { en: string; bn?: string; hi?: string };
  options: Array<{ en: string; bn?: string; hi?: string }>;
  correct_index: number;
  explanation?: { en: string; bn?: string; hi?: string };
};

function buildPrompt(args: {
  exam: string;
  subject: string;
  difficulty: string;
  count: number;
  topic?: string;
}) {
  return `You are an expert question setter for the ${args.exam.toUpperCase()} examination in India.

Generate exactly ${args.count} high-quality, original multiple-choice questions for the subject "${args.subject}"${args.topic ? ` on the topic "${args.topic}"` : ""}, at difficulty level: ${args.difficulty}.

Rules:
- Each question must have EXACTLY 4 options.
- Provide question text, all 4 options, and a brief explanation in English (en), Bengali (bn), and Hindi (hi).
- correct_index is 0-based (0..3).
- Difficulty "${args.difficulty}" must be respected. Easy = direct recall, Medium = application, Hard = multi-step reasoning.
- No duplicate questions. No questions referencing answer choices like "all of the above".
- Output ONLY a valid JSON array. No markdown, no commentary, no code fences.

Format:
[
  {
    "question": {"en":"...", "bn":"...", "hi":"..."},
    "options": [
      {"en":"...","bn":"...","hi":"..."},
      {"en":"...","bn":"...","hi":"..."},
      {"en":"...","bn":"...","hi":"..."},
      {"en":"...","bn":"...","hi":"..."}
    ],
    "correct_index": 0,
    "explanation": {"en":"...","bn":"...","hi":"..."}
  }
]`;
}

function extractJsonArray(text: string): unknown[] {
  // Strip markdown code fences if present
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI did not return a JSON array");
  const slice = t.slice(start, end + 1);
  const parsed = JSON.parse(slice);
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed;
}

function validateQuestion(q: unknown): AIQuestion | null {
  if (!q || typeof q !== "object") return null;
  const obj = q as Record<string, unknown>;
  const question = obj.question as AIQuestion["question"] | undefined;
  const options = obj.options as AIQuestion["options"] | undefined;
  const correct = obj.correct_index;
  if (!question?.en) return null;
  if (!Array.isArray(options) || options.length !== 4) return null;
  if (typeof correct !== "number" || correct < 0 || correct > 3) return null;
  if (options.some((o) => !o?.en)) return null;
  return {
    question,
    options,
    correct_index: correct,
    explanation: (obj.explanation as AIQuestion["explanation"]) ?? undefined,
  };
}

export const generateAIQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Admin check
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Admin role required");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Resolve subject id
    const { data: subject, error: sErr } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("slug", data.subjectSlug)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!subject) throw new Error(`Subject not found: ${data.subjectSlug}`);

    // Log job
    const { data: job, error: jErr } = await supabase
      .from("ai_generation_jobs")
      .insert({
        created_by: userId,
        target_exam: data.targetExam,
        subject_id: subject.id,
        difficulty: data.difficulty,
        count_requested: data.count,
        status: "running",
        model: MODEL,
      })
      .select("id")
      .single();
    if (jErr) throw new Error(jErr.message);

    try {
      const prompt = buildPrompt({
        exam: data.targetExam,
        subject: subject.name,
        difficulty: data.difficulty,
        count: data.count,
        topic: data.topic,
      });

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
      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content ?? "";
      const parsed = extractJsonArray(content);
      const valid = parsed.map(validateQuestion).filter((q): q is AIQuestion => q !== null);

      if (valid.length === 0) throw new Error("AI returned no usable questions");

      const status = data.autoApprove ? "approved" : "pending_review";
      const rows = valid.map((q) => ({
        subject_id: subject.id,
        target_exam: data.targetExam as
          | "ssc_cgl"
          | "ssc_chsl"
          | "wbcs"
          | "wbpsc"
          | "railway"
          | "banking"
          | "police"
          | "other",
        difficulty: data.difficulty,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? null,
        is_published: true,
        status: status as "approved" | "pending_review",
        ai_generated: true,
        created_by: userId,
        ...(data.autoApprove
          ? { reviewed_by: userId, reviewed_at: new Date().toISOString() }
          : {}),
      }));

      const { error: insErr } = await supabase.from("questions").insert(rows);
      if (insErr) throw new Error(insErr.message);

      await supabase
        .from("ai_generation_jobs")
        .update({
          status: "completed",
          count_created: rows.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return { jobId: job.id, created: rows.length, requested: data.count, status };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("ai_generation_jobs")
        .update({ status: "failed", error: msg, completed_at: new Date().toISOString() })
        .eq("id", job.id);
      throw new Error(msg);
    }
  });
