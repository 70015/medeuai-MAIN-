import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Crown, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { StripeEmbeddedCheckout } from "@/components/stripe-embedded-checkout";
import { isPaymentsConfigured, getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession, getPlanStatus } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — ParikshaSathi" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: BillingPage,
});

const PLANS = [
  {
    priceId: "pro_monthly" as const,
    name: "Pro Monthly",
    price: "₹99",
    cadence: "per month",
    perks: ["Unlimited mock tests", "AI explanations & similar questions", "Full analytics"],
  },
  {
    priceId: "pro_yearly" as const,
    name: "Pro Yearly",
    price: "₹799",
    cadence: "per year — save ₹389",
    perks: ["Everything in Monthly", "Priority support", "Early access to new exams"],
    highlight: true,
  },
];

function BillingPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);
  const planStatusFn = useServerFn(getPlanStatus);
  const portalFn = useServerFn(createPortalSession);

  const configured = isPaymentsConfigured();
  const env = configured ? getStripeEnvironment() : "sandbox";

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan-status", env],
    queryFn: () => planStatusFn({ data: { environment: env } }),
  });

  // Refresh after returning from checkout
  useEffect(() => {
    if (search.session_id) {
      toast.success("Payment received. Activating your Pro plan…");
      const t = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["plan-status"] });
        navigate({ to: "/billing", search: {} });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [search.session_id, navigate, queryClient]);

  const portal = useMutation({
    mutationFn: () =>
      portalFn({
        data: { environment: env, returnUrl: window.location.href },
      }),
    onSuccess: (r) => {
      if ("error" in r) throw new Error(r.error);
      window.open(r.url, "_blank");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (checkoutPrice) {
    const returnUrl = `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    return (
      <div className="space-y-4">
        <PaymentTestModeBanner />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Complete payment</h1>
          <Button variant="ghost" size="sm" onClick={() => setCheckoutPrice(null)}>
            Cancel
          </Button>
        </div>
        <Card className="border-border/60 bg-card/40 p-4">
          <StripeEmbeddedCheckout priceId={checkoutPrice} returnUrl={returnUrl} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Billing & Plans</h1>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
      ) : plan?.isPro ? (
        <Card className="border-primary/40 bg-primary/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge className="mb-2">Pro active</Badge>
              <h2 className="text-lg font-semibold">
                You're on the {plan.priceId === "pro_yearly" ? "Yearly" : "Monthly"} plan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Status: {plan.status}
                {plan.currentPeriodEnd
                  ? ` · ${plan.cancelAtPeriodEnd ? "Ends" : "Renews"} ${new Date(plan.currentPeriodEnd).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
            >
              {portal.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-1 h-4 w-4" />
              )}
              Manage subscription
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-border/60 bg-card/40 p-6">
          <h2 className="text-lg font-semibold">Free plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan
              ? `${plan.attemptsInWindow} of ${plan.freeAttemptsAllowed} free attempts used in the last ${plan.windowDays} days.`
              : "3 free mock tests every 30 days."}
          </p>
        </Card>
      )}

      {!plan?.isPro && (
        <div className="grid gap-4 md:grid-cols-2">
          {PLANS.map((p) => (
            <Card
              key={p.priceId}
              className={
                "relative border-border/60 bg-card/40 p-6 " +
                (p.highlight ? "border-primary/60 ring-1 ring-primary/30" : "")
              }
            >
              {p.highlight && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  <Sparkles className="mr-1 h-3 w-3" /> Best value
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                disabled={!configured}
                onClick={() => setCheckoutPrice(p.priceId)}
              >
                {configured ? "Subscribe" : "Payments not configured"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
