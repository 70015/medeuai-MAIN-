import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Clock, Crown, Loader2, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BackLink } from "@/components/back-link";
import { getPlanStatus } from "@/lib/razorpay.functions";
import { getMyPaymentRequests, getPaymentSettings } from "@/lib/payments.functions";
import { redeemPromoCode } from "@/lib/promo.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Plans — MedEu.Ai" },
      {
        name: "description",
        content: "Manage your MedEu.Ai Pro plan, pay by UPI and redeem promo codes.",
      },
    ],
  }),
  component: BillingPage,
});

const PLANS = [
  {
    lookup_key: "pro_monthly" as const,
    name: "Pro Monthly",
    cadence: "per month",
    perks: ["Unlimited mock tests", "AI explanations & similar questions", "Full analytics"],
  },
  {
    lookup_key: "pro_yearly" as const,
    name: "Pro Yearly",
    cadence: "per year",
    perks: ["Everything in Monthly", "Priority support", "Early access to new exams"],
    highlight: true,
  },
];

function BillingPage() {
  const queryClient = useQueryClient();
  const planFn = useServerFn(getPlanStatus);
  const settingsFn = useServerFn(getPaymentSettings);
  const requestsFn = useServerFn(getMyPaymentRequests);
  const redeemFn = useServerFn(redeemPromoCode);
  const [promoCode, setPromoCode] = useState("");

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan-status"],
    queryFn: () => planFn(),
  });

  const { data: settings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => settingsFn(),
  });

  const { data: myRequests } = useQuery({
    queryKey: ["my-payment-requests"],
    queryFn: () => requestsFn(),
  });

  const pending = myRequests?.find((r) => r.status === "pending");

  const redeem = useMutation({
    mutationFn: () => redeemFn({ data: { code: promoCode } }),
    onSuccess: (r) => {
      toast.success(r.message);
      setPromoCode("");
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const priceFor = (key: "pro_monthly" | "pro_yearly") =>
    key === "pro_yearly" ? settings?.yearlyPriceInr : settings?.monthlyPriceInr;

  return (
    <div className="space-y-6">
      <BackLink to="/profile" label="Back to Profile" />

      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-[#03824F]" />
        <h1 className="text-xl font-bold tracking-tight">Billing & Plans</h1>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
      ) : plan?.isPro ? (
        <Card className="border-[#03824F]/40 bg-[#EAF7F1] p-6">
          <Badge className="mb-2 bg-[#03824F] text-white hover:bg-[#02663E]">Pro active</Badge>
          <h2 className="text-lg font-semibold text-[#04211C]">
            You're on the {plan.priceId === "pro_yearly" ? "Yearly" : "Monthly"} plan
          </h2>
          <p className="mt-1 text-sm text-[#33403D]">
            Status: {plan.status}
            {plan.currentPeriodEnd
              ? ` · access until ${new Date(plan.currentPeriodEnd).toLocaleDateString()}`
              : ""}
          </p>
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

      {pending && (
        <Card className="border-[#02663E]/40 bg-card/40 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-[#03824F]" /> Payment awaiting verification
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your ₹{pending.amount_inr} payment (UTR {pending.utr}) is being reviewed. Pro unlocks
            as soon as it's verified.
          </p>
          <Link to="/pay/$plan" params={{ plan: pending.plan }}>
            <Button variant="outline" className="mt-3">
              View payment status
            </Button>
          </Link>
        </Card>
      )}

      {!plan?.isPro && !pending && (
        <div className="grid gap-4 md:grid-cols-2">
          {PLANS.map((p) => (
            <Card
              key={p.lookup_key}
              className={
                "relative border-border/60 bg-card/40 p-6 " +
                (p.highlight ? "border-[#03824F]/60 ring-1 ring-[#03824F]/20" : "")
              }
            >
              {p.highlight && (
                <Badge className="absolute -top-2 right-4 bg-[#03824F] text-white hover:bg-[#02663E]">
                  <Sparkles className="mr-1 h-3 w-3" /> Best value
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {priceFor(p.lookup_key) ? `₹${priceFor(p.lookup_key)}` : "—"}
                </span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-[#03824F]" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              {settings?.upiId ? (
                <Link to="/pay/$plan" params={{ plan: p.lookup_key }} className="mt-6 block">
                  <Button className="w-full bg-[#03824F] text-white hover:bg-[#02663E]">
                    Subscribe with UPI
                  </Button>
                </Link>
              ) : (
                <Button className="mt-6 w-full" disabled>
                  Payments not configured
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border/60 bg-card/40 p-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#03824F]" />
          <h3 className="text-sm font-semibold">Have a promo code?</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Redeem a code to unlock Pro for free or get a discount.
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
            className="bg-[#04211C] text-white hover:bg-[#02663E]"
            disabled={!promoCode.trim() || redeem.isPending}
            onClick={() => redeem.mutate()}
          >
            {redeem.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Redeem
          </Button>
        </div>
      </Card>
    </div>
  );
}
