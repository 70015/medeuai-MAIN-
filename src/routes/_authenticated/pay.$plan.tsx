import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/back-link";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentSettings, type PlanKey } from "@/lib/payments.functions";
import { getPaddlePriceId, initializePaddle } from "@/lib/paddle";

export const Route = createFileRoute("/_authenticated/pay/$plan")({
  head: () => ({
    meta: [
      { title: "Subscribe to Pro | MedEuAi" },
      {
        name: "description",
        content:
          "Subscribe to MedEuAi Pro for unlimited mock tests and unlimited AI Teacher access.",
      },
    ],
  }),
  component: PayPage,
});

const PLAN_LABEL: Record<PlanKey, { name: string; cadence: string; perks: string[] }> = {
  pro_monthly: {
    name: "Pro Monthly",
    cadence: "Billed every month",
    perks: ["Unlimited mock tests", "Unlimited AI Teacher", "Full analytics"],
  },
  pro_yearly: {
    name: "Pro Yearly",
    cadence: "Billed once a year",
    perks: ["Everything in Monthly", "Priority support", "Early access to new exams"],
  },
};

function PayPage() {
  const { plan: rawPlan } = useParams({ from: "/_authenticated/pay/$plan" });
  const plan: PlanKey = rawPlan === "pro_yearly" ? "pro_yearly" : "pro_monthly";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const settingsFn = useServerFn(getPaymentSettings);
  const { data: settings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => settingsFn(),
  });

  const amount = settings
    ? plan === "pro_yearly"
      ? settings.yearlyPriceInr
      : settings.monthlyPriceInr
    : null;

  const [opening, setOpening] = useState(false);

  function handlePaddleEvent(e: any) {
    if (e?.name === "checkout.completed") {
      toast.success("Payment successful! Activating your Pro plan...");
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
      setTimeout(() => navigate({ to: "/billing" }), 1500);
    }
    if (e?.name === "checkout.error") {
      toast.error("The payment could not be completed. Please try again.");
    }
  }

  async function openCheckout() {
    setOpening(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) throw new Error("Please sign in again");

      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(plan);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/billing?checkout=success`,
          allowLogout: false,
          variant: "one-page",
          locale: "en",
        },
        eventCallback: handlePaddleEvent,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open checkout");
    } finally {
      setOpening(false);
    }
  }

  const meta = PLAN_LABEL[plan];

  return (
    <>
      <PaymentTestModeBanner />
      <div className="mx-auto w-full max-w-xl space-y-5 pb-24">
        <BackLink to="/billing" label="Back to Billing" />

        <div>
          <Badge className="bg-[#EAF7F1] text-[#04211C] hover:bg-[#EAF7F1]">
            {meta.name}
          </Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Subscribe to Pro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.cadence} · Pro unlocks immediately after payment.
          </p>
        </div>

        <Card className="border-border/60 bg-card/40 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-3xl font-bold tracking-tight">
              {amount ? `₹${amount}` : "-"}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {plan === "pro_yearly" ? "/ year" : "/ month"}
              </span>
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {meta.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#03824F]" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <Button
            className="mt-6 w-full bg-[#03824F] text-white hover:bg-[#02663E]"
            disabled={opening}
            onClick={openCheckout}
          >
            {opening ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-1.5 h-4 w-4" />
            )}
            Pay securely
          </Button>

          <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Card, UPI and other payment methods are handled by our secure payment provider.
            Your subscription activates instantly and renews automatically. You can cancel any
            time from the Billing page.
          </p>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By subscribing you agree to our{" "}
          <Link to="/terms-and-conditions" className="font-medium text-[#03824F] underline">
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy-policy" className="font-medium text-[#03824F] underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </>
  );
}
