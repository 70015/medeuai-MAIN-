import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TTS_URL = "https://ai.gateway.lovable.dev/v1/audio/speech";

const Input = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().optional(),
});

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text.slice(0, 4000),
        voice: data.voice ?? "alloy",
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Voice is busy, try again.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`TTS error (${res.status}): ${t.slice(0, 160)}`);
    }

    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { audio: `data:audio/mpeg;base64,${base64}` };
  });
