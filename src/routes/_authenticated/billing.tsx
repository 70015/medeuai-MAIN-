import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Loader2, Sparkles, Tag, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
  getPlanStatus,
  getRazorpayConfig,
  verifyRazorpayPayment,
} from "@/lib/razorpay.functions";
import { redeemPromoCode } from "@/lib/promo.functions";


export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — ParikshaSathi" }] }),
  component: BillingPage,
});

const PLANS = [
  {
    lookup_key: "pro_monthly" as const,
    name: "Pro Monthly",
    price: "₹99",
    cadence: "per month",
    perks: ["Unlimited mock tests", "AI explanations & similar questions", "Full analytics"],
  },
  {
    lookup_key: "pro_yearly" as const,
    name: "Pro Yearly",
    price: "₹799",
    cadence: "per year — save ₹389",
    perks: ["Everything in Monthly", "Priority support", "Early access to new exams"],
    highlight: true,
  },
];

function BillingPage() {
  const queryClient = useQueryClient();
  const planFn = useServerFn(getPlanStatus);
  const configFn = useServerFn(getRazorpayConfig);
  const createSubFn = useServerFn(createRazorpaySubscription);
  const verifyFn = useServerFn(verifyRazorpayPayment);
  const cancelFn = useServerFn(cancelRazorpaySubscription);
  const redeemFn = useServerFn(redeemPromoCode);
  const [promoCode, setPromoCode] = useState("");


  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan-status"],
    queryFn: () => planFn(),
  });

  const { data: config } = useQuery({
    queryKey: ["razorpay-config"],
    queryFn: () => configFn(),
  });

  const subscribe = useMutation({
    mutationFn: async (lookup_key: "pro_monthly" | "pro_yearly") => {
      if (!config?.keyId) throw new Error("Razorpay is not configured yet");
      const { data: u } = await supabase.auth.getUser();
      const { subscriptionId } = await createSubFn({ data: { lookup_key } });
      await new Promise<void>((resolve, reject) => {
        openRazorpayCheckout({
          keyId: config.keyId!,
          subscriptionId,
          name: "ParikshaSathi",
          description: lookup_key === "pro_yearly" ? "Pro Yearly Subscription" : "Pro Monthly Subscription",
          prefill: { email: u?.user?.email ?? undefined },
          onSuccess: async (r) => {
            try {
              await verifyFn({ data: r });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          onDismiss: () => reject(new Error("Checkout cancelled")),
        });
      });
    },
    onSuccess: () => {
      toast.success("Subscription activated. Welcome to Pro!");
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
    },
    onError: (e: Error) => {
      if (e.message !== "Checkout cancelled") toast.error(e.message);
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn(),
    onSuccess: () => {
      toast.success("Subscription will end at the period close");
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const redeem = useMutation({
    mutationFn: () => redeemFn({ data: { code: promoCode } }),
    onSuccess: (r) => {
      toast.success(r.message);
      setPromoCode("");
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });



  return (
    <div className="space-y-6">
      {config && !config.keyId && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
        </div>
      )}
      {config?.environment === "test" && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs text-orange-300">
          Test mode — use card 4111 1111 1111 1111, any future expiry, any CVV, OTP 1234.
        </div>
      )}
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
            {!plan.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Cancel subscription at the end of the current period?")) cancel.mutate();
                }}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-1 h-4 w-4" />
                )}
                Cancel subscription
              </Button>
            )}
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
              key={p.lookup_key}
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
                disabled={!config?.keyId || subscribe.isPending}
                onClick={() => subscribe.mutate(p.lookup_key)}
              >
                {subscribe.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {config?.keyId ? "Subscribe" : "Payments not configured"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border/60 bg-card/40 p-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Have a promo code?</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Redeem a code to unlock Pro for free or get a discount at checkout.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="ENTER CODE"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            maxLength={64}
            className="font-mono uppercase tracking-wider"
          />
          <Button
            disabled={!promoCode.trim() || redeem.isPending}
            onClick={() => redeem.mutate()}
          >
            {redeem.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : null}
            Redeem
          </Button>
        </div>
      </Card>

    </div>
  );
}
