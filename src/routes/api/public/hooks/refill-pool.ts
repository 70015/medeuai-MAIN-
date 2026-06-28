import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refill-pool")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: require apikey header to match anon key (set by pg_cron).
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
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
