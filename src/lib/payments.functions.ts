import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanKey = "pro_monthly" | "pro_yearly";

export type PaymentSettings = {
  merchantName: string;
  upiId: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  monthlyQrPath: string | null;
  yearlyQrPath: string | null;
  upiIntentEnabled: boolean;
  qrEnabled: boolean;
  instructions: string;
  freeAttemptsAllowed: number;
  freeWindowDays: number;
  freeAiDailyLimit: number;
};

const PlanEnum = z.enum(["pro_monthly", "pro_yearly"]);

// ---------- Read settings (any signed-in user) ----------
export const getPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PaymentSettings> => {
    const { data, error } = await context.supabase
      .from("payment_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      merchantName: data?.merchant_name ?? "MedEu.Ai",
      upiId: data?.upi_id ?? "",
      monthlyPriceInr: data?.monthly_price_inr ?? 0,
      yearlyPriceInr: data?.yearly_price_inr ?? 0,
      monthlyQrPath: data?.monthly_qr_path ?? null,
      yearlyQrPath: data?.yearly_qr_path ?? null,
      upiIntentEnabled: !!data?.upi_intent_enabled,
      qrEnabled: !!data?.qr_enabled,
      instructions: data?.instructions ?? "",
      freeAttemptsAllowed: data?.free_attempts_allowed ?? 3,
      freeWindowDays: data?.free_window_days ?? 30,
      freeAiDailyLimit: data?.free_ai_daily_limit ?? 10,
    };
  });

// ---------- Admin: save settings ----------
const SettingsInput = z.object({
  merchant_name: z.string().trim().min(1).max(120),
  upi_id: z.string().trim().max(160),
  monthly_price_inr: z.number().int().min(1).max(1_000_000),
  yearly_price_inr: z.number().int().min(1).max(1_000_000),
  monthly_qr_path: z.string().trim().max(400).nullable(),
  yearly_qr_path: z.string().trim().max(400).nullable(),
  upi_intent_enabled: z.boolean(),
  qr_enabled: z.boolean(),
  instructions: z.string().trim().max(2000),
  free_attempts_allowed: z.number().int().min(0).max(1000),
  free_window_days: z.number().int().min(1).max(365),
  free_ai_daily_limit: z.number().int().min(0).max(1000),
});


async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("payment_settings")
      .update({ ...data })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- User: my payment requests ----------
export const getMyPaymentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_requests")
      .select("id, plan, amount_inr, utr, paid_on, status, admin_note, created_at, reviewed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- User: submit a request ----------
const SubmitInput = z.object({
  plan: PlanEnum,
  utr: z.string().trim().min(6).max(64),
  paid_on: z.string().trim().min(8).max(10),
  screenshot_path: z.string().trim().max(400).nullable().optional(),
});

export const submitPaymentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settings } = await supabaseAdmin
      .from("payment_settings")
      .select("monthly_price_inr, yearly_price_inr, upi_id")
      .eq("singleton", true)
      .maybeSingle();
    if (!settings) throw new Error("Payments are not configured yet");

    // Amount always comes from the admin-managed settings, never the client.
    const amount =
      data.plan === "pro_yearly" ? settings.yearly_price_inr : settings.monthly_price_inr;

    const { data: pending } = await supabaseAdmin
      .from("payment_requests")
      .select("id, plan")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) {
      throw new Error(
        "You already have a payment awaiting verification. We'll review it shortly.",
      );
    }

    const { data: dup } = await supabaseAdmin
      .from("payment_requests")
      .select("id")
      .eq("utr", data.utr.trim())
      .maybeSingle();
    if (dup) throw new Error("This transaction ID has already been submitted.");

    const { data: inserted, error } = await supabaseAdmin
      .from("payment_requests")
      .insert({
        user_id: userId,
        plan: data.plan,
        amount_inr: amount,
        upi_id: settings.upi_id,
        utr: data.utr.trim(),
        paid_on: data.paid_on,
        screenshot_path: data.screenshot_path ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, amount };
  });

// ---------- Admin: list requests ----------
export const listPaymentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids)
      : { data: [] as Array<{ id: string; email: string; full_name: string | null }> };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      user_email: byId.get(r.user_id)?.email ?? null,
      user_name: byId.get(r.user_id)?.full_name ?? null,
    }));
  });

// ---------- Admin: verify / reject ----------
const ReviewInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["verify", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export const reviewPaymentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    // Both RPCs re-check the admin role inside the database.
    if (data.action === "verify") {
      const { data: res, error } = await context.supabase.rpc("verify_payment_request", {
        p_request_id: data.id,
        p_note: data.note,
      });
      if (error) throw new Error(error.message);
      const row = Array.isArray(res) ? res[0] : res;
      return { status: "verified" as const, expiresAt: row?.out_expires_at ?? null };
    }
    const { error } = await context.supabase.rpc("reject_payment_request", {
      p_request_id: data.id,
      p_note: data.note,
    });
    if (error) throw new Error(error.message);
    return { status: "rejected" as const, expiresAt: null };
  });

// ---------- Admin: signed screenshot URL ----------
export const getProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl ?? null };
  });
