import { Link, useRouterState } from "@tanstack/react-router";
import { Info, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isAuthRoute = pathname.startsWith("/auth");
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden text-base min-[430px]:inline">
            Pariksha<span className="text-primary">Sathi</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1">
          <a
            href="#features"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Features
          </a>
          <a
            href="#exams"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Exams
          </a>
          <a
            href="#pricing"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Pricing
          </a>
          <Link
            to="/about"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <Info className="h-4 w-4" />
            About
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {hasSession ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : !isAuthRoute ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Get started</span>
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
