import { useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";

/**
 * Wraps page content and re-triggers an enter animation on every route
 * change by keying the wrapper with the current pathname. Uses
 * tw-animate-css utilities so no custom keyframes are needed.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
