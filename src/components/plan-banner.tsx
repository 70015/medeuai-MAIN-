import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPlanStatus } from "@/lib/plan.functions";

/**
 * In-app notice shown when Pro is about to expire or has just lapsed.
 * Renders nothing for healthy Pro users and for free users who still have attempts.
 */
export function PlanBanner() {
  const planFn = useServerFn(getPlanStatus);
  const { data: plan } = useQuery({
    queryKey: ["plan-status"],
    queryFn: () => planFn(),
  });

  if (!plan) return null;

  const outOfAttempts = !plan.isPro && plan.attemptsInWindow >= plan.freeAttemptsAllowed;
  if (!plan.expiringSoon && !outOfAttempts) return null;

  const expiring = plan.expiringSoon;

  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 " +
        (expiring
          ? "border-amber-500/50 bg-amber-50/70 dark:bg-amber-950/20"
          : "border-[#03824F]/40 bg-[#EAF7F1] dark:bg-[#03824F]/10")
      }
    >
      <div className="flex items-start gap-2.5">
        {expiring ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        ) : (
          <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[#03824F]" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {expiring
              ? `Your Pro plan ends in ${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"}`
              : "You've used all your free mock tests"}
          </p>
          <p className="text-xs text-muted-foreground">
            {expiring
              ? "Renew now — the new period is added on top of your remaining days."
              : `Free plan allows ${plan.freeAttemptsAllowed} tests every ${plan.windowDays} days. Go Pro for unlimited tests and AI Teacher.`}
          </p>
        </div>
      </div>
      <Link to="/billing">
        <Button size="sm" className="bg-[#03824F] text-white hover:bg-[#02663E]">
          {expiring ? "Renew Pro" : "Upgrade to Pro"}
        </Button>
      </Link>
    </div>
  );
}
