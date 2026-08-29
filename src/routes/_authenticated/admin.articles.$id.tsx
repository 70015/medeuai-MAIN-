import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2, Save, Upload } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  ARTICLE_CATEGORIES,
  getAdminArticle,
  saveArticle,
  slugify,
} from "@/lib/articles-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin — MedEu.Ai" }] }),
  component: ArticleEditor,
});

type Category = (typeof ARTICLE_CATEGORIES)[number];

function ArticleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getFn = useServerFn(getAdminArticle);
  const saveFn = useServerFn(saveArticle);

  const { data: article, isLoading } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: !isNew,
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [featured, setFeatured] = useState("");
  const [category, setCategory] = useState<Category>("MedEuAi");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  useEffect(() => {
    if (!article) return;
    setTitle(article.title);
    setSlug(article.slug);
    setSlugTouched(true);
    setExcerpt(article.excerpt ?? "");
    setFeatured(article.featured_image ?? "");
    setCategory(article.category as Category);
    setContent(article.content ?? "");
    setMetaTitle(article.meta_title ?? "");
    setMetaDescription(article.meta_description ?? "");
    setStatus(article.status === "published" ? "published" : "draft");
  }, [article]);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  const save = useMutation({
    mutationFn: (nextStatus: "draft" | "published") =>
      saveFn({
        data: {
          ...(isNew ? {} : { id }),
          title,
          slug: effectiveSlug,
          excerpt,
          content,
          featured_image: featured,
          category,
          status: nextStatus,
          meta_title: metaTitle,
          meta_description: metaDescription,
        },
      }),
    onSuccess: (res, nextStatus) => {
      setStatus(nextStatus);
      toast.success(nextStatus === "published" ? "Published" : "Draft saved");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "published"] });
      if (isNew && res?.id) {
        navigate({ to: "/admin/articles/$id", params: { id: res.id } });
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-article", id] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disabled = save.isPending || title.trim().length < 3;

  if (!isNew && isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading article…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/admin/articles">
            <ArrowLeft className="mr-1 h-4 w-4" /> All articles
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && effectiveSlug ? (
            <Button asChild size="sm" variant="ghost">
              <Link
                to="/articles/$slug"
                params={{ slug: effectiveSlug }}
                target="_blank"
              >
                <Eye className="mr-1 h-4 w-4" /> Preview
              </Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => save.mutate("draft")}
          >
            {save.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => save.mutate("published")}
          >
            <Upload className="mr-1 h-4 w-4" />
            {status === "published" ? "Update & publish" : "Publish"}
          </Button>
        </div>
      </div>

      <Card className="space-y-4 border-border/60 bg-card/40 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to crack SSC CGL in 90 days"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="auto-derived from title"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              /articles/{effectiveSlug || "…"}
            </p>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Short summary shown in the article list"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="featured">Featured image URL</Label>
            <Input
              id="featured"
              value={featured}
              onChange={(e) => setFeatured(e.target.value)}
              placeholder="https://…"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-2 border-border/60 bg-card/40 p-4 sm:p-6">
        <Label>Content</Label>
        <RichTextEditor value={content} onChange={setContent} />
      </Card>

      <Card className="space-y-4 border-border/60 bg-card/40 p-4 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold">SEO metadata</h3>
          <p className="text-xs text-muted-foreground">
            Used in the page head on /articles/{effectiveSlug || "slug"}.
          </p>
        </div>
        <div>
          <Label htmlFor="metaTitle">Meta title</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Falls back to the article title"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {metaTitle.length}/60 characters
          </p>
        </div>
        <div>
          <Label htmlFor="metaDescription">Meta description</Label>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            placeholder="Falls back to the excerpt"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {metaDescription.length}/160 characters
          </p>
        </div>
      </Card>
    </div>
  );
}
