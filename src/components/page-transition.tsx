import { useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";

/**
 * Lightweight route-change fade. Kept short (150ms) so navigation feels
 * snappy — a longer transition made the app feel sluggish.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div
      key={pathname}
      className="animate-in fade-in duration-150 ease-out motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
