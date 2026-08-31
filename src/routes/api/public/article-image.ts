import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, read-only proxy for images stored in the private `article-media`
 * bucket. Article images must be viewable by anonymous readers, so we stream
 * them through this route instead of exposing the bucket publicly.
 */
export const Route = createFileRoute("/api/public/article-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("path") ?? "";
        // Only allow simple object paths inside the bucket.
        if (!path || path.includes("..") || !/^[\w./-]+$/.test(path)) {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin.storage
          .from("article-media")
          .download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
