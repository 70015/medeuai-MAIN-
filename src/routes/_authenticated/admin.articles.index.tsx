import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Download,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listAdminArticles,
  setArticleStatus,
  deleteArticle,
} from "@/lib/articles-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/articles/")({
  head: () => ({ meta: [{ title: "Articles — Admin — MedEu.Ai" }] }),
  component: AdminArticlesList,
});

type Filter = "all" | "draft" | "published";

function AdminArticlesList() {
  const listFn = useServerFn(listAdminArticles);
  const statusFn = useServerFn(setArticleStatus);
  const deleteFn = useServerFn(deleteArticle);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => listFn(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    queryClient.invalidateQueries({ queryKey: ["articles", "published"] });
  };

  const toggle = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" }) =>
      statusFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.status === "published" ? "Published" : "Moved to draft");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Article deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (q && !a.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Content → Articles</h2>
          <p className="text-sm text-muted-foreground">
            Write, publish, and manage blog articles for the public site.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/articles/$id" params={{ id: "new" }}>
            <Plus className="mr-1 h-4 w-4" /> New article
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "published"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "secondary" : "ghost"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading articles…
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No articles match this view yet.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <Card
              key={a.id}
              className="flex flex-wrap items-center gap-3 border-border/60 bg-card/40 p-3"
            >
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.title}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                      (a.status === "published"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground")
                    }
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  /articles/{a.slug} · {a.category}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button asChild size="sm" variant="ghost">
                  <Link to="/articles/$slug" params={{ slug: a.slug }} target="_blank">
                    <Eye className="mr-1 h-4 w-4" /> Preview
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/admin/articles/$id" params={{ id: a.id }}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Link>
                </Button>
                {a.status === "published" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ id: a.id, status: "draft" })}
                  >
                    <Download className="mr-1 h-4 w-4" /> Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate({ id: a.id, status: "published" })
                    }
                  >
                    <Upload className="mr-1 h-4 w-4" /> Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete "${a.title}"? This cannot be undone.`))
                      remove.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
