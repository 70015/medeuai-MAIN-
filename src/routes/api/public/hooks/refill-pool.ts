import { createFileRoute } from "@tanstack/react-router";

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const Route = createFileRoute("/api/public/hooks/refill-pool")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: require a server-only shared secret. We accept either a
        // dedicated CRON_SECRET or the service role key (used by pg_cron).
        // The Supabase publishable/anon key is NOT accepted, it is exposed
        // in the client bundle and cannot be treated as a secret.
        const provided =
          request.headers.get("x-cron-secret") ??
          request.headers.get("x-cron-key") ??
          "";
        const cronSecret = process.env.CRON_SECRET ?? "";
        const poolSecret = process.env.POOL_CRON_SECRET ?? "";
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
        const ok =
          (cronSecret !== "" && timingSafeStringEqual(provided, cronSecret)) ||
          (poolSecret !== "" && timingSafeStringEqual(provided, poolSecret)) ||
          (serviceKey !== "" && timingSafeStringEqual(provided, serviceKey));

        if (!provided || !ok) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { refillAllPools } = await import("@/lib/paper-pool.server");

        const started = Date.now();
        const result = await refillAllPools(supabaseAdmin, { allowAI: true });
        const elapsedMs = Date.now() - started;

        return Response.json({
          ok: true,
          elapsedMs,
          createdTotal: result.createdTotal,
          tests: result.perTest.length,
        });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to refill pool" }),
    },
  },
});
