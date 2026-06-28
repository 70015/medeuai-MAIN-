import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type GrantType = "pro_monthly" | "pro_yearly" | "custom" | "discount";

// ============================================
// REDEEM: any authenticated user
// ============================================
export const redeemPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase().trim();

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!promo) throw new Error("Invalid promo code");
    if (!promo.active) throw new Error("This code is no longer active");
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      throw new Error("This code has expired");
    }

    // One redemption per user
    const { data: prior } = await supabase
      .from("promo_redemptions")
      .select("id")
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (prior) throw new Error("You already redeemed this code");

    const grant = promo.grant_type as GrantType;

    if (grant === "discount") {
      // Discount applies at checkout — just record the redemption intent
      await supabase.from("promo_redemptions").insert({
        promo_code_id: promo.id,
        user_id: userId,
        applied_plan: "discount",
      });
      await supabase
        .from("promo_codes")
        .update({ redemption_count: promo.redemption_count + 1 })
        .eq("id", promo.id);
      return {
        success: true,
        kind: "discount" as const,
        discountPercent: promo.discount_percent,
        message: `Discount of ${promo.discount_percent}% will apply at checkout.`,
      };
    }

    // Determine plan + days
    let plan: "pro_monthly" | "pro_yearly";
    let days: number;
    if (grant === "pro_monthly") {
      plan = "pro_monthly";
      days = promo.duration_days ?? 30;
    } else if (grant === "pro_yearly") {
      plan = "pro_yearly";
      days = promo.duration_days ?? 365;
    } else {
      // custom
      plan = (promo.plan_tier as "pro_monthly" | "pro_yearly") ?? "pro_monthly";
      days = promo.duration_days ?? 30;
    }

    const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();

    // Upgrade profile
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        plan,
        subscription_status: "active",
      })
      .eq("id", userId);
    if (profErr) throw new Error(profErr.message);

    // Insert a subscription row so the existing downgrade cron respects the expiry.
    // RLS restricts inserts to service_role, so use the admin client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      provider: "promo",
      status: "active",
      current_period_end: expiresAt,
      price_id: plan,
      environment: "live",
    });
    if (subErr) throw new Error(subErr.message);

    await supabase.from("promo_redemptions").insert({
      promo_code_id: promo.id,
      user_id: userId,
      applied_plan: plan,
      expires_at: expiresAt,
    });

    await supabase
      .from("promo_codes")
      .update({ redemption_count: promo.redemption_count + 1 })
      .eq("id", promo.id);

    return {
      success: true,
      kind: "plan" as const,
      plan,
      expiresAt,
      message: `Pro unlocked! Your ${plan === "pro_yearly" ? "Yearly" : "Monthly"} access is active until ${new Date(expiresAt).toLocaleDateString()}.`,
    };
  });

// ============================================
// ADMIN: create code
// ============================================
const CreateInput = z.object({
  code: z.string().trim().min(3).max(64),
  grant_type: z.enum(["pro_monthly", "pro_yearly", "custom", "discount"]),
  duration_days: z.number().int().positive().nullish(),
  plan_tier: z.enum(["pro_monthly", "pro_yearly"]).nullish(),
  discount_percent: z.number().int().min(1).max(100).nullish(),
  expires_at: z.string().nullish(),
  notes: z.string().max(500).nullish(),
});

export const createPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const code = data.code.toUpperCase().trim();
    const { error } = await supabase.from("promo_codes").insert({
      code,
      grant_type: data.grant_type,
      duration_days: data.duration_days ?? null,
      plan_tier: data.plan_tier ?? null,
      discount_percent: data.discount_percent ?? null,
      expires_at: data.expires_at || null,
      notes: data.notes ?? null,
      created_by: userId,
    });
    if (error) {
      if (error.code === "23505") throw new Error("That code already exists");
      throw new Error(error.message);
    }
    return { success: true, code };
  });

// ============================================
// ADMIN: toggle / delete
// ============================================
export const togglePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase
      .from("promo_codes")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("promo_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
