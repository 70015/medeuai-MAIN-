import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listPublishedArticles } from "@/lib/articles.functions";

const articlesQuery = queryOptions({
  queryKey: ["articles", "published"],
  queryFn: () => listPublishedArticles(),
});

export const Route = createFileRoute("/articles/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesQuery),
  head: () => ({
    meta: [
      { title: "Articles — MedEu.Ai" },
      { name: "description", content: "Exam preparation articles, study guides, and AI learning resources from MedEu.Ai." },
      { property: "og:title", content: "Articles — MedEu.Ai" },
      { property: "og:description", content: "Exam preparation articles, study guides, and AI learning resources from MedEu.Ai." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://medeuai.in/articles" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://medeuai.in/articles" }],
  }),
  component: ArticlesPage,
});

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ArticlesPage() {
  const { data: articles } = useSuspenseQuery(articlesQuery);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="mb-8 sm:mb-10">
        <span className="brand-eyebrow">MedEu.Ai Blog</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Articles &amp; Study Resources
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Guides, exam strategies, and AI-powered learning insights to help you prepare smarter.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No articles published yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="brand-card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
            >
              {a.featured_image ? (
                <img
                  src={a.featured_image}
                  alt={a.title}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-accent-foreground">
                    {a.category}
                  </span>
                  {a.published_at ? (
                    <time className="text-muted-foreground">
                      {formatDate(a.published_at)}
                    </time>
                  ) : null}
                </div>
                <h2 className="text-lg font-semibold leading-snug group-hover:text-primary">
                  {a.title}
                </h2>
                {a.excerpt ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {a.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
