import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";

import { listPublishedArticles } from "@/lib/articles.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SITE_PAGES = [
  { title: "Home", href: "/" },
  { title: "Articles", href: "/articles" },
  { title: "About", href: "/about" },
  { title: "Sign up / Login", href: "/auth" },
  { title: "Privacy Policy", href: "/privacy-policy" },
];

export function LinkDialog({
  open,
  onOpenChange,
  initialHref,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialHref?: string;
  onPick: (href: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [href, setHref] = useState(initialHref ?? "");

  const articles = useQuery({
    queryKey: ["articles", "published"],
    enabled: open,
    queryFn: () => listPublishedArticles(),
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const all = [
      ...SITE_PAGES,
      ...(articles.data ?? []).map((a) => ({
        title: a.title,
        href: `/articles/${a.slug}`,
      })),
    ];
    const q = query.trim().toLowerCase();
    return q ? all.filter((o) => o.title.toLowerCase().includes(q)) : all;
  }, [articles.data, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add link</DialogTitle>
        </DialogHeader>

        <div>
          <Label htmlFor="link-search" className="text-xs">
            Internal page or article
          </Label>
          <Input
            id="link-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search MedEu.Ai pages and articles"
            className="mt-1"
          />
          <div className="mt-2 max-h-52 overflow-y-auto rounded border border-border/60">
            {options.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No matches.</p>
            ) : (
              options.map((o) => (
                <button
                  key={o.href}
                  type="button"
                  onClick={() => setHref(o.href)}
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary/60",
                    href === o.href && "bg-secondary",
                  )}
                >
                  <span className="line-clamp-1">{o.title}</span>
                  <span className="text-xs text-muted-foreground">{o.href}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="link-url" className="text-xs">
            Or URL (internal path or external https link)
          </Label>
          <Input
            id="link-url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://example.com"
            className="mt-1"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onPick(null);
              onOpenChange(false);
            }}
          >
            Remove link
          </Button>
          <Button
            type="button"
            disabled={!href.trim()}
            onClick={() => {
              onPick(href.trim());
              onOpenChange(false);
            }}
          >
            <Link2 className="mr-1 h-4 w-4" /> Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
