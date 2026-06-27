import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLANS = [
  {
    lookup_key: "pro_monthly",
    name: "ParikshaSathi Pro Monthly",
    period: "monthly" as const,
    interval: 1,
    amount: 9900, // ₹99 in paise
  },
  {
    lookup_key: "pro_yearly",
    name: "ParikshaSathi Pro Yearly",
    period: "yearly" as const,
    interval: 1,
    amount: 79900, // ₹799 in paise
  },
];

// ---------- Public: get checkout key id ----------
export const getRazorpayConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { getRazorpayKeyId, getRazorpayEnvironment } = await import("@/lib/razorpay.server");
  try {
    return { keyId: getRazorpayKeyId(), environment: getRazorpayEnvironment() };
  } catch {
    return { keyId: null, environment: "test" as const };
  }
});

// ---------- Admin: ensure plans exist in Razorpay ----------
export const ensureRazorpayPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { rzpFetch, getRazorpayEnvironment } = await import("@/lib/razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const env = getRazorpayEnvironment();
    const results: Array<{ lookup_key: string; razorpay_plan_id: string; created: boolean }> = [];

    for (const p of PLANS) {
      // Check if already cached
      const { data: existing } = await supabaseAdmin
        .from("razorpay_plans")
        .select("razorpay_plan_id")
        .eq("lookup_key", p.lookup_key)
        .eq("environment", env)
        .maybeSingle();
      if (existing) {
        results.push({ lookup_key: p.lookup_key, razorpay_plan_id: existing.razorpay_plan_id, created: false });
        continue;
      }

      const created = await rzpFetch<{ id: string }>("/plans", {
        method: "POST",
        body: {
          period: p.period,
          interval: p.interval,
          item: {
            name: p.name,
            amount: p.amount,
            currency: "INR",
            description: `${p.name} subscription`,
          },
          notes: { lookup_key: p.lookup_key, environment: env },
        },
      });

      await supabaseAdmin.from("razorpay_plans").insert({
        lookup_key: p.lookup_key,
        razorpay_plan_id: created.id,
        period: p.period,
        interval: p.interval,
        amount: p.amount,
        currency: "INR",
        name: p.name,
        environment: env,
      });
      results.push({ lookup_key: p.lookup_key, razorpay_plan_id: created.id, created: true });
    }
    return { plans: results };
  });

// ---------- Create subscription ----------
const CreateSubInput = z.object({
  lookup_key: z.enum(["pro_monthly", "pro_yearly"]),
});

export const createRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSubInput.parse(d))
  .handler(async ({ data, context }) => {
    const { rzpFetch, getRazorpayEnvironment } = await import("@/lib/razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const env = getRazorpayEnvironment();

    const { data: plan } = await supabaseAdmin
      .from("razorpay_plans")
      .select("razorpay_plan_id")
      .eq("lookup_key", data.lookup_key)
      .eq("environment", env)
      .maybeSingle();
    if (!plan) {
      throw new Error(
        "Subscription plans not initialized. An admin must run 'Initialize Razorpay Plans' in /admin first.",
      );
    }

    const { data: u } = await context.supabase.auth.getUser();
    const email = u?.user?.email;

    const sub = await rzpFetch<{
      id: string;
      short_url: string;
      status: string;
      customer_id?: string;
    }>("/subscriptions", {
      method: "POST",
      body: {
        plan_id: plan.razorpay_plan_id,
        total_count: data.lookup_key === "pro_yearly" ? 5 : 60, // 5y or 5y of monthly
        customer_notify: 1,
        notes: { userId: context.userId, email: email ?? "", lookup_key: data.lookup_key },
      },
    });

    // Pre-create a pending subscription row
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        provider: "razorpay",
        razorpay_subscription_id: sub.id,
        razorpay_customer_id: sub.customer_id ?? null,
        razorpay_plan_id: plan.razorpay_plan_id,
        price_id: data.lookup_key,
        status: sub.status,
        environment: env,
        short_url: sub.short_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "razorpay_subscription_id" },
    );

    return {
      subscriptionId: sub.id,
      shortUrl: sub.short_url,
    };
  });

// ---------- Verify checkout signature ----------
const VerifyInput = z.object({
  razorpay_payment_id: z.string(),
  razorpay_subscription_id: z.string(),
  razorpay_signature: z.string(),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VerifyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { verifySubscriptionPaymentSignature, rzpFetch, getRazorpayEnvironment } = await import(
      "@/lib/razorpay.server"
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ok = await verifySubscriptionPaymentSignature(data);
    if (!ok) throw new Error("Invalid payment signature");

    // Fetch the latest subscription from Razorpay to get current period
    const sub = await rzpFetch<{
      id: string;
      status: string;
      current_start?: number;
      current_end?: number;
      charge_at?: number;
      customer_id?: string;
      plan_id?: string;
    }>(`/subscriptions/${data.razorpay_subscription_id}`);

    const periodEndIso = sub.current_end
      ? new Date(sub.current_end * 1000).toISOString()
      : null;

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: sub.status,
        razorpay_customer_id: sub.customer_id ?? null,
        current_period_start: sub.current_start
          ? new Date(sub.current_start * 1000).toISOString()
          : null,
        current_period_end: periodEndIso,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", data.razorpay_subscription_id)
      .eq("user_id", context.userId);

    // Flip the profile to Pro so feature gating unlocks immediately.
    const proStatuses = ["active", "authenticated", "trialing"];
    if (proStatuses.includes(sub.status)) {
      await supabaseAdmin
        .from("profiles")
        .update({
          plan: "pro",
          subscription_status: sub.status,
          subscription_expires_at: periodEndIso,
        })
        .eq("id", context.userId);
    }

    return { status: sub.status, currentPeriodEnd: sub.current_end ?? null };

  });

// ---------- Cancel ----------
export const cancelRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { rzpFetch, getRazorpayEnvironment } = await import("@/lib/razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const env = getRazorpayEnvironment();

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("razorpay_subscription_id")
      .eq("user_id", context.userId)
      .eq("environment", env)
      .eq("provider", "razorpay")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.razorpay_subscription_id) throw new Error("No active subscription");

    const cancelled = await rzpFetch<{ status: string; ended_at?: number }>(
      `/subscriptions/${sub.razorpay_subscription_id}/cancel`,
      { method: "POST", body: { cancel_at_cycle_end: 1 } },
    );

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: cancelled.status,
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", sub.razorpay_subscription_id);

    return { status: cancelled.status };
  });

// ---------- Plan status (provider-agnostic) ----------
export type PlanStatus = {
  isPro: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  attemptsInWindow: number;
  freeAttemptsAllowed: number;
  windowDays: number;
  canStartTest: boolean;
};

const FREE_ATTEMPTS = 3;
const WINDOW_DAYS = 30;

export const getPlanStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanStatus> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, price_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
    const activeStatuses = ["active", "authenticated", "trialing", "past_due"];
    const isPro =
      !!sub &&
      ((activeStatuses.includes(sub.status) && (!periodEnd || periodEnd > now)) ||
        (["canceled", "cancelled"].includes(sub.status) && periodEnd && periodEnd > now));

    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", since);

    const attemptsInWindow = count ?? 0;
    return {
      isPro: !!isPro,
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
      priceId: sub?.price_id ?? null,
      attemptsInWindow,
      freeAttemptsAllowed: FREE_ATTEMPTS,
      windowDays: WINDOW_DAYS,
      canStartTest: !!isPro || attemptsInWindow < FREE_ATTEMPTS,
    };
  });
