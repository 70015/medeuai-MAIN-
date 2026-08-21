import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai-teacher-prompt";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const FREE_DAILY_LIMIT = 10;

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  language: z.enum(["english", "bengali", "hindi"]).optional(),
  targetExam: z.string().max(80).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  mode: z.enum(["teach", "steps", "quiz", "plan"]).optional(),
  studentName: z.string().max(80).optional(),
});

function err(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/ai-teacher")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || token.split(".").length !== 3) return err("Unauthorized", 401);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return err("AI is not configured. Contact admin.", 500);

        let parsed;
        try {
          parsed = Input.parse(await request.json());
        } catch {
          return err("Invalid request", 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: claims, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimsError || !userId) return err("Unauthorized", 401);

        // Daily quota for free users
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        const isPro = profile?.plan === "pro_monthly" || profile?.plan === "pro_yearly";
        if (!isPro) {
          const today = new Date().toISOString().slice(0, 10);
          const { data: usage } = await supabaseAdmin
            .from("ai_teacher_usage")
            .select("count")
            .eq("user_id", userId)
            .eq("day", today)
            .maybeSingle();
          const used = usage?.count ?? 0;
          if (used >= FREE_DAILY_LIMIT) {
            return err(
              `Free plan limit reached (${FREE_DAILY_LIMIT} questions/day). Upgrade to Pro for unlimited AI Teacher.`,
              429,
            );
          }
          await supabaseAdmin.from("ai_teacher_usage").upsert(
            {
              user_id: userId,
              day: today,
              count: used + 1,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,day" },
          );
        }

        const upstream = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "raw-fetch",
          },
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            messages: [
              { role: "system", content: buildSystemPrompt(parsed) },
              ...parsed.messages,
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          if (upstream.status === 429) return err("AI is busy right now. Try again in a moment.", 429);
          if (upstream.status === 402) return err("AI credits exhausted. Contact admin.", 402);
          return err(`AI error (${upstream.status}): ${text.slice(0, 160)}`, 502);
        }

        // Re-stream SSE deltas as plain text chunks.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;
                  try {
                    const json = JSON.parse(payload) as {
                      choices?: Array<{ delta?: { content?: string } }>;
                    };
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    // ignore partial/non-JSON keepalives
                  }
                }
              }
            } catch (e) {
              console.error("[ai-teacher] stream error", e);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
