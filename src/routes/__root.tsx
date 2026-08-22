import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/page-transition";
import { supabase } from "@/integrations/supabase/client";
import { isAdminHost } from "@/lib/host";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold tracking-tight gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MedEu.Ai — Your Personal AI Teacher, 24/7" },
      {
        name: "description",
        content:
          "AI mock tests, PYQs and analytics for SSC, WBCS, Railway and Banking — in Bengali, Hindi and English.",
      },
      { name: "author", content: "MedEu.Ai" },
      { name: "theme-color", content: "#04211C" },
      { property: "og:site_name", content: "MedEu.Ai" },
      { property: "og:title", content: "MedEu.Ai — Your Personal AI Teacher, 24/7" },
      {
        property: "og:description",
        content: "AI mock tests, PYQs and analytics for SSC, WBCS, Railway and Banking — in Bengali, Hindi and English.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MedEu.Ai — Your Personal AI Teacher, 24/7" },
      { name: "twitter:description", content: "AI mock tests, PYQs and analytics for SSC, WBCS, Railway and Banking — in Bengali, Hindi and English." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MedEu.Ai",
          url: "https://pariksha-sathi-ai.lovable.app",
          logo: "https://pariksha-sathi-ai.lovable.app/favicon.ico",
          description: "Your Personal AI Teacher, 24/7 — AI-powered exam prep for SSC, WBCS, Railway, Banking and more Indian government exams.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MedEu.Ai",
          url: "https://pariksha-sathi-ai.lovable.app",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Admin Mode: when served from admin.* subdomain, force any non-admin,
  // non-auth path to /admin so the subdomain feels like a separate site.
  useEffect(() => {
    if (!isAdminHost()) return;
    const path = window.location.pathname;
    const allowed =
      path.startsWith("/admin") ||
      path.startsWith("/auth") ||
      path.startsWith("/reset-password");
    if (!allowed) {
      router.navigate({ to: "/admin", replace: true });
    }
  }, [router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <RootOutlet />
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Authenticated routes render inside <AppShell>, which owns its own
  // PageTransition scoped to <main> so the header doesn't re-animate.
  const isAuthenticatedShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tests") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/ai-teacher") ||
    pathname.startsWith("/attempt") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/admin");
  if (isAuthenticatedShell) return <Outlet />;
  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}
