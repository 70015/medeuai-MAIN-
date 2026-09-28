import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlanEnum = z.enum(["pro_monthly", "pro_yearly"]);

function creds() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret, auth: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") };
}

// Create a Razorpay order. Amount is taken from admin payment settings, never from the client.
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ plan: PlanEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const { keyId, auth } = creds();
    const { data: s } = await context.supabase
      .from("payment_settings")
      .select("monthly_price_inr, yearly_price_inr")
      .eq("singleton", true)
      .maybeSingle();
    const inr = data.plan === "pro_yearly" ? s?.yearly_price_inr : s?.monthly_price_inr;
    const amount = Math.round(Number(inr ?? 0) * 100);
    if (!amount || amount < 100) throw new Error("Invalid amount (minimum ₹1)");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`.slice(0, 40),
        notes: { userId: context.userId, plan: data.plan },
      }),
    });
    if (!res.ok) {
      console.error("Razorpay order error", res.status, await res.text());
      throw new Error(res.status === 401 ? "Payment provider authentication failed" : "Could not create order");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return { order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId };
  });

// Verify signature, then unlock Pro.
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        razorpay_order_id: z.string().min(1).max(100),
        razorpay_payment_id: z.string().min(1).max(100),
        razorpay_signature: z.string().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { keySecret, auth } = creds();
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Payment verification failed");

    // Confirm the order belongs to this user and read the plan from it.
    const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(data.razorpay_order_id)}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) throw new Error("Could not confirm order");
    const order = (await res.json()) as { notes?: { userId?: string; plan?: string } };
    if (order.notes?.userId !== context.userId) throw new Error("Order does not belong to this account");
    const plan = order.notes?.plan === "pro_yearly" ? "pro_yearly" : "pro_monthly";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("razorpay_subscription_id", data.razorpay_payment_id)
      .maybeSingle();
    if (!existing) {
      const start = new Date();
      const end = new Date(start);
      if (plan === "pro_yearly") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        user_id: context.userId,
        provider: "razorpay",
        razorpay_subscription_id: data.razorpay_payment_id,
        price_id: plan,
        status: "active",
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        environment: process.env["RAZORPAY_KEY_ID"]?.startsWith("rzp_live_") ? "live" : "sandbox",
      } as any);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });
