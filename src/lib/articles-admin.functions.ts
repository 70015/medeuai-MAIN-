import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORIES = [
  "SSC",
  "UPSC",
  "Banking",
  "Railways",
  "AI",
  "Study",
  "Exam Preparation",
  "MedEuAi",
] as const;

export const ARTICLE_CATEGORIES = CATEGORIES;

const ADMIN_COLUMNS =
  "id, title, slug, excerpt, content, featured_image, category, status, published_at, created_at, updated_at, meta_title, meta_description, noindex" as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Admin role required");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export const listAdminArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, slug, category, status, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: article, error } = await supabase
      .from("articles")
      .select(ADMIN_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return article;
  });

const SaveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().default(""),
  featured_image: z.string().optional(),
  category: z.enum(CATEGORIES),
  status: z.enum(["draft", "published"]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  noindex: z.boolean().optional(),
});

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const baseSlug = slugify(data.slug?.trim() || data.title);
    if (!baseSlug) throw new Error("Could not derive a slug from the title");

    // Ensure slug uniqueness.
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const q = supabase.from("articles").select("id").eq("slug", slug).limit(1);
      const { data: clash } = data.id ? await q.neq("id", data.id) : await q;
      if (!clash || clash.length === 0) break;
      slug = `${baseSlug}-${i}`;
    }

    const row = {
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt?.trim() || null,
      content: data.content,
      featured_image: data.featured_image?.trim() || null,
      category: data.category,
      status: data.status,
      meta_title: data.meta_title?.trim() || null,
      meta_description: data.meta_description?.trim() || null,
      noindex: data.noindex ?? false,
      published_at:
        data.status === "published" ? new Date().toISOString() : null,
    };

    if (data.id) {
      // Keep the original publish date when it is already published.
      const { data: existing } = await supabase
        .from("articles")
        .select("published_at, status")
        .eq("id", data.id)
        .maybeSingle();
      if (
        data.status === "published" &&
        existing?.status === "published" &&
        existing?.published_at
      ) {
        row.published_at = existing.published_at;
      }
      const { data: updated, error } = await supabase
        .from("articles")
        .update(row)
        .eq("id", data.id)
        .select("id, slug")
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }

    const { data: created, error } = await supabase
      .from("articles")
      .insert(row)
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const setArticleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    let publishedAt: string | null = null;
    if (data.status === "published") {
      const { data: existing } = await supabase
        .from("articles")
        .select("published_at")
        .eq("id", data.id)
        .maybeSingle();
      publishedAt = existing?.published_at ?? new Date().toISOString();
    }
    const patch = { status: data.status, published_at: publishedAt };

    const { error } = await supabase
      .from("articles")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
