import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const Input = z.object({
  messages: z.array(Message).min(1).max(40),
  language: z.enum(["english", "bengali", "hindi"]).optional(),
  targetExam: z.string().optional(),
});

const SYSTEM = (lang: string, exam?: string) =>
  `You are ParikshaSathi AI Teacher — a patient, expert tutor for Indian government competitive exams${
    exam ? ` (focus: ${exam.toUpperCase()})` : ""
  }.
Respond primarily in ${lang}. Mix in English technical terms when natural.
Style:
- Explain concepts step by step with short paragraphs and bullet points.
- For math/reasoning, show the working clearly.
- Give a worked example, then a practice question at the end when relevant.
- Be concise but thorough. Use markdown formatting.
- If asked something outside competitive exam prep, politely steer back.`;

const FREE_DAILY_LIMIT = 10;

export const askAITeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Contact admin.");

    // Enforce daily quota for non-Pro users
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    const isPro = profile?.plan === "pro_monthly" || profile?.plan === "pro_yearly";

    if (!isPro) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabaseAdmin
        .from("ai_teacher_usage")
        .select("count")
        .eq("user_id", context.userId)
        .eq("day", today)
        .maybeSingle();
      const used = usage?.count ?? 0;
      if (used >= FREE_DAILY_LIMIT) {
        throw new Error(
          `Free plan limit reached (${FREE_DAILY_LIMIT} questions/day). Upgrade to Pro for unlimited AI Teacher access.`,
        );
      }
      await supabaseAdmin.from("ai_teacher_usage").upsert(
        {
          user_id: context.userId,
          day: today,
          count: used + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,day" },
      );
    }


    const lang =
      data.language === "bengali"
        ? "Bengali (বাংলা)"
        : data.language === "hindi"
          ? "Hindi (हिन्दी)"
          : "English";

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
          { role: "system", content: SYSTEM(lang, data.targetExam) },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429)
        throw new Error("AI is busy right now. Please try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Please contact admin to add credits.");
      throw new Error(`AI error (${res.status}): ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("AI returned an empty response.");
    return { content };
  });
