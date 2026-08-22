import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Consistent in-app back affordance for secondary/deeper screens.
 * Always a real Link to the logical parent route (never history.back), so the
 * destination is predictable and browser history stays intact.
 */
export function BackLink({
  label,
  className,
  ...linkProps
}: { label: string; className?: string } & ComponentProps<typeof Link>) {
  return (
    <Link
      {...linkProps}
      className={cn(
        "-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
