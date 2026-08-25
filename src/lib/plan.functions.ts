import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanStatus = {
  isPro: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  daysLeft: number | null;
  priceId: string | null;
  provider: string | null;
  attemptsInWindow: number;
  freeAttemptsAllowed: number;
  windowDays: number;
  aiDailyLimit: number;
  aiUsedToday: number;
  canStartTest: boolean;
  expiringSoon: boolean;
};

export const getPlanStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanStatus> => {
    const { supabase, userId } = context;
    const { resolveEntitlement, getFreeLimits } = await import("@/lib/entitlement.server");

    const [ent, limits] = await Promise.all([
      resolveEntitlement(supabase, userId),
      getFreeLimits(supabase),
    ]);

    const since = new Date(
      Date.now() - limits.freeWindowDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { count } = await supabase
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", since);

    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await supabase
      .from("ai_teacher_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("day", today)
      .maybeSingle();

    const attemptsInWindow = count ?? 0;
    return {
      isPro: ent.isPro,
      status: ent.status,
      currentPeriodEnd: ent.expiresAt,
      daysLeft: ent.daysLeft,
      priceId: ent.priceId,
      provider: ent.provider,
      attemptsInWindow,
      freeAttemptsAllowed: limits.freeAttemptsAllowed,
      windowDays: limits.freeWindowDays,
      aiDailyLimit: limits.freeAiDailyLimit,
      aiUsedToday: usage?.count ?? 0,
      canStartTest: ent.isPro || attemptsInWindow < limits.freeAttemptsAllowed,
      expiringSoon: ent.isPro && ent.daysLeft !== null && ent.daysLeft <= 7,
    };
  });
