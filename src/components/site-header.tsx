import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full glass">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-ink-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">
            MedEu<span className="text-primary">.Ai</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#exams" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Exams
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
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
                  Get started
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
