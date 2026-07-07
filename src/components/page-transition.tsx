import { useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";

/**
 * Wraps page content and re-triggers a fade/slide-in animation on every
 * route change by keying the wrapper with the current pathname.
 * Uses the existing `animate-fade-in` utility from styles.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={pathname} className="animate-fade-in motion-reduce:animate-none">
      {children}
    </div>
  );
}
