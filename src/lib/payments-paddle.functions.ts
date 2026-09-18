import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

const EnvEnum = z.enum(["sandbox", "live"]);
const PlanEnum = z.enum(["pro_monthly", "pro_yearly"]);

// ---------- Resolve human-readable price ID to the provider's internal ID ----------
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });

// ---------- Current Paddle subscription for the signed-in user ----------
export const getMyPaddleSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ environment: EnvEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("subscriptions")
      .select(
        "id, paddle_subscription_id, price_id, status, current_period_end, created_at",
      )
      .eq("user_id", context.userId)
      .eq("provider", "paddle")
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

async function getActivePaddleSub(context: { supabase: any; userId: string }, env: PaddleEnv) {
  const { data: row } = await context.supabase
    .from("subscriptions")
    .select("id, paddle_subscription_id, price_id, status, current_period_end")
    .eq("user_id", context.userId)
    .eq("provider", "paddle")
    .eq("environment", env)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.paddle_subscription_id) throw new Error("No active subscription found");
  return row;
}

// ---------- Cancel: access ends immediately ----------
export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ environment: EnvEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const sub = await getActivePaddleSub(context, data.environment);
    const paddle = getPaddleClient(data.environment);
    await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
      effectiveFrom: "immediately",
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: now,
        cancel_at_period_end: false,
        updated_at: now,
      })
      .eq("paddle_subscription_id", sub.paddle_subscription_id);
    return { ok: true };
  });

// ---------- Switch monthly <-> yearly, charged pro-rata immediately ----------
export const switchMyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ environment: EnvEnum, plan: PlanEnum }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sub = await getActivePaddleSub(context, data.environment);
    if (sub.price_id === data.plan) throw new Error("You are already on this plan");

    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.plan)}`,
    );
    const result = await response.json();
    const newPriceId = result.data?.[0]?.id as string | undefined;
    if (!newPriceId) throw new Error("Price not found");

    const paddle = getPaddleClient(data.environment);
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: "prorated_immediately",
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({
        price_id: data.plan,
        product_id: "pro_plan",
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", sub.paddle_subscription_id);
    return { ok: true };
  });

// ---------- Hosted portal: update payment method, view invoices ----------
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ environment: EnvEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const sub = await getActivePaddleSub(context, data.environment);
    const { data: full } = await context.supabase
      .from("subscriptions")
      .select("paddle_customer_id")
      .eq("id", sub.id)
      .single();
    if (!full?.paddle_customer_id) throw new Error("No billing account found");

    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(full.paddle_customer_id, [
      sub.paddle_subscription_id,
    ]);
    return { url: session.urls.general.overview };
  });
