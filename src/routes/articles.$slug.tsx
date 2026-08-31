import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  getPublishedArticle,
  listPublishedArticles,
} from "@/lib/articles.functions";
import { Button } from "@/components/ui/button";
import { BrandLockup, SocialLinks } from "@/components/brand-logo";

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

function ArticleHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="container mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="shrink-0">
          <BrandLockup />
        </Link>
        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Try MedEuAi</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function CtaStrip({
  heading,
  text,
  action = "Try MedEuAi",
}: {
  heading: string;
  text: string;
  action?: string;
}) {
  return (
    <aside className="my-8 rounded-lg border border-primary/30 bg-primary/5 p-5 text-center">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <Button asChild size="sm" className="mt-3">
        <Link to="/auth">{action}</Link>
      </Button>
    </aside>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { data: all } = useQuery({
    queryKey: ["articles", "published"],
    queryFn: () => listPublishedArticles(),
    staleTime: 60_000,
  });

  const related = (all ?? [])
    .filter((a) => a.slug !== slug)
    .sort((a, b) =>
      a.category === article.category ? -1 : b.category === article.category ? 1 : 0,
    )
    .slice(0, 3);

  return (
    <>
      <ArticleHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/articles" className="hover:text-foreground">
                Articles
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="line-clamp-1 text-foreground">{article.title}</li>
          </ol>
        </nav>

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

          <CtaStrip
            heading="Start your preparation today"
            text="Your personal AI teacher, mock tests and instant doubt solving — free to start."
            action="Get Started"
          />

          <div
            className="article-content mt-8 text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <CtaStrip
            heading="Ready to prepare smarter?"
            text="Learn, practice and improve with MedEu.Ai."
          />
        </article>

        {related.length > 0 ? (
          <section className="mt-10 border-t border-border/60 pt-6">
            <h2 className="text-lg font-semibold">More articles</h2>
            <ul className="mt-3 space-y-2">
              {related.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/articles/$slug"
                    params={{ slug: a.slug }}
                    className="text-sm text-primary hover:underline"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="mt-10 flex flex-col items-center gap-3 border-t border-border/60 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            MedEu.Ai — Your Personal AI Teacher, 24/7.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/auth">Try MedEuAi</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/articles">All articles</Link>
            </Button>
          </div>
          <SocialLinks />
        </footer>
      </main>
    </>
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
