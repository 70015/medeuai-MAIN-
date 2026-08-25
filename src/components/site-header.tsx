import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-logo";
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
          <BrandLockup markClassName="h-9 w-9 sm:h-10 sm:w-10" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {[
            { label: "AI Teacher", href: "/#ai-teacher" },
            { label: "Practice", href: "/#practice" },
            { label: "Exams", href: "/#exams" },
            { label: "How it works", href: "/#how-it-works" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isNativeApp() &&
            (apkAvailable ? (
              <Button asChild variant="outline" size="sm">
                <a href={APK_URL} download aria-label="Download the MedEu.Ai Android app">
                  <Download className="mr-1.5 h-4 w-4" /> Download App
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <a href="/#android-app" aria-label="Android app coming soon">
                  <Download className="mr-1.5 h-4 w-4" /> App coming soon
                </a>
              </Button>
            ))}
          <ThemeToggle />

          {hasSession ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : !isAuthRoute ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Login
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start Learning
                </Link>
              </Button>
            </>
          ) : null}
        </div>

      </div>
    </header>
  );
}
