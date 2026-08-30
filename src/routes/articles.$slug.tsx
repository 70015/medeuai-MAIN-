import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublishedArticle } from "@/lib/articles.functions";
import { Button } from "@/components/ui/button";

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["articles", "published", slug],
    queryFn: async () => {
      const article = await getPublishedArticle({ data: { slug } });
      if (!article) throw notFound();
      return article;
    },
  });

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article not found — MedEu.Ai" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const desc =
      loaderData.meta_description ??
      loaderData.excerpt ??
      `Read "${loaderData.title}" on MedEu.Ai.`;
    const pageTitle =
      loaderData.meta_title ?? `${loaderData.title} — MedEu.Ai`;
    const url = `https://medeuai.in/articles/${params.slug}`;
    const noindex = Boolean(loaderData.noindex);
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: desc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: desc },
        ...(noindex
          ? [{ name: "robots", content: "noindex, nofollow" }]
          : [{ name: "robots", content: "index, follow" }]),
        ...(loaderData.featured_image
          ? [
              { property: "og:image", content: loaderData.featured_image },
              { name: "twitter:image", content: loaderData.featured_image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(noindex
        ? {}
        : {
            scripts: [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: loaderData.title,
                  description: desc,
                  mainEntityOfPage: { "@type": "WebPage", "@id": url },
                  url,
                  articleSection: loaderData.category,
                  ...(loaderData.featured_image
                    ? { image: loaderData.featured_image }
                    : {}),
                  ...(loaderData.published_at
                    ? { datePublished: loaderData.published_at }
                    : {}),
                  ...(loaderData.updated_at
                    ? { dateModified: loaderData.updated_at }
                    : {}),
                  publisher: {
                    "@type": "Organization",
                    name: "MedEu.Ai",
                    logo: {
                      "@type": "ImageObject",
                      url: "https://medeuai.in/favicon.png",
                    },
                  },
                }),
              },
            ],
          }),
    };
  },
  component: ArticlePage,
  notFoundComponent: ArticleNotFound,
});

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/articles">← All articles</Link>
      </Button>

      <article>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-accent-foreground">
            {article.category}
          </span>
          {article.published_at ? (
            <time className="text-muted-foreground">
              {formatDate(article.published_at)}
            </time>
          ) : null}
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>

        {article.excerpt ? (
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {article.excerpt}
          </p>
        ) : null}

        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="mt-6 w-full rounded-lg border object-cover"
          />
        ) : null}

        <div
          className="article-content mt-8 text-base leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </main>
  );
}

function ArticleNotFound() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This article doesn't exist or hasn't been published yet.
      </p>
      <Button asChild size="sm" className="mt-6">
        <Link to="/articles">Browse articles</Link>
      </Button>
    </main>
  );
}
