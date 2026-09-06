import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * One-time bootstrap: promote the caller to admin if NO admin exists yet.
 * Safe because once any admin is set, this becomes a no-op.
 */
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      return { promoted: false, alreadyAdmin: !!isAdmin };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { promoted: true, alreadyAdmin: true };
  });

const ReviewInput = z.object({
  questionId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const reviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin role required");

    const { error } = await supabase
      .from("questions")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.questionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin role required");

    const [users, approved, pending, attempts] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("test_attempts")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
    ]);

    return {
      users: users.count ?? 0,
      approvedQuestions: approved.count ?? 0,
      pendingQuestions: pending.count ?? 0,
      attempts: attempts.count ?? 0,
    };
  });

const RoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "user"]),
  action: z.enum(["grant", "revoke"]),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RoleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isSuper } = await supabase.rpc("is_super_admin", {
      _user_id: userId,
    });
    if (!isSuper) throw new Error("Only the Super Admin can manage roles");

    const { data: superRow } = await supabase
      .from("super_admin")
      .select("user_id")
      .maybeSingle();
    if (superRow?.user_id === data.userId) {
      throw new Error("The Super Admin account cannot be modified");
    }

    // Uses the caller's own session so the database-side Super Admin rules apply.
    if (data.action === "grant") {
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: data.userId, role: data.role },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin role required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, target_exam, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    const { data: superRow } = await supabaseAdmin
      .from("super_admin")
      .select("user_id")
      .maybeSingle();

    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });

    return {
      superAdminId: superRow?.user_id ?? null,
      viewerIsSuperAdmin: superRow?.user_id === userId,
      users: (profiles ?? []).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      })),
    };
  });


