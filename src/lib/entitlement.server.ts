// Server-only entitlement helpers. Single source of truth for "is this user Pro"
// and for the admin-configurable free-tier limits.

export type FreeLimits = {
  freeAttemptsAllowed: number;
  freeWindowDays: number;
  freeAiDailyLimit: number;
};

export const DEFAULT_FREE_LIMITS: FreeLimits = {
  freeAttemptsAllowed: 3,
  freeWindowDays: 30,
  freeAiDailyLimit: 10,
};

export async function getFreeLimits(client: any): Promise<FreeLimits> {
  const { data } = await client
    .from("payment_settings")
    .select("free_attempts_allowed, free_window_days, free_ai_daily_limit")
    .eq("singleton", true)
    .maybeSingle();
  return {
    freeAttemptsAllowed: data?.free_attempts_allowed ?? DEFAULT_FREE_LIMITS.freeAttemptsAllowed,
    freeWindowDays: data?.free_window_days ?? DEFAULT_FREE_LIMITS.freeWindowDays,
    freeAiDailyLimit: data?.free_ai_daily_limit ?? DEFAULT_FREE_LIMITS.freeAiDailyLimit,
  };
}

export type Entitlement = {
  isPro: boolean;
  status: string | null;
  expiresAt: string | null;
  priceId: string | null;
  provider: string | null;
  daysLeft: number | null;
};

const ACTIVE_STATUSES = ["active", "authenticated", "trialing", "past_due"];
const GRACE_STATUSES = ["canceled", "cancelled"];

/**
 * Resolves the caller's entitlement from `subscriptions` (authoritative, holds the
 * paid period end) with a `profiles` fallback for promo grants. Expiry is always
 * checked against `now()` so an expired row never grants access, even before the
 * hourly downgrade job runs.
 */
export async function resolveEntitlement(client: any, userId: string): Promise<Entitlement> {
  const now = Date.now();

  const { data: subs } = await client
    .from("subscriptions")
    .select("status, current_period_end, price_id, provider, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const rows: any[] = subs ?? [];
  // The best row is the un-expired one with the furthest period end.
  const usable = rows
    .filter((r) => {
      const end = r.current_period_end ? new Date(r.current_period_end).getTime() : null;
      const notExpired = end === null || end > now;
      return (ACTIVE_STATUSES.includes(r.status) && notExpired) ||
        (GRACE_STATUSES.includes(r.status) && end !== null && end > now);
    })
    .sort((a, b) => {
      const ae = a.current_period_end ? new Date(a.current_period_end).getTime() : Infinity;
      const be = b.current_period_end ? new Date(b.current_period_end).getTime() : Infinity;
      return be - ae;
    });

  const best = usable[0];
  if (best) {
    const end = best.current_period_end ? new Date(best.current_period_end).getTime() : null;
    return {
      isPro: true,
      status: best.status,
      expiresAt: best.current_period_end ?? null,
      priceId: best.price_id ?? null,
      provider: best.provider ?? null,
      daysLeft: end === null ? null : Math.max(0, Math.ceil((end - now) / 86400_000)),
    };
  }

  // Fallback: promo/manual grants recorded only on the profile.
  const { data: prof } = await client
    .from("profiles")
    .select("plan, subscription_status, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  const profEnd = prof?.subscription_expires_at
    ? new Date(prof.subscription_expires_at).getTime()
    : null;
  const profPro =
    !!prof &&
    (prof.plan === "pro_monthly" || prof.plan === "pro_yearly") &&
    prof.subscription_status === "active" &&
    (profEnd === null || profEnd > now);

  const latest = rows[0];
  return {
    isPro: profPro,
    status: profPro ? "active" : (latest?.status ?? prof?.subscription_status ?? null),
    expiresAt: profPro
      ? (prof?.subscription_expires_at ?? null)
      : (latest?.current_period_end ?? prof?.subscription_expires_at ?? null),
    priceId: profPro ? (prof?.plan ?? null) : (latest?.price_id ?? null),
    provider: profPro ? "grant" : (latest?.provider ?? null),
    daysLeft:
      profPro && profEnd !== null ? Math.max(0, Math.ceil((profEnd - now) / 86400_000)) : null,
  };
}
