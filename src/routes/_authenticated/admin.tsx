import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Shield, Sparkles, ListChecks, LayoutDashboard, BookText, Users, Info, Tag, Layers, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { claimAdminIfNone } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | MedEuAi" }] }),
  component: AdminLayout,
});

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return !!data;
    },
  });
}

const tabs = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/syllabi", label: "Syllabi", icon: BookText, exact: false },
  { to: "/admin/generate", label: "AI Generate", icon: Sparkles, exact: false },
  { to: "/admin/review", label: "Review Queue", icon: ListChecks, exact: false },
  { to: "/admin/pool", label: "Paper Pool", icon: Layers, exact: false },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, exact: false },
  { to: "/admin/promos", label: "Promo Codes", icon: Tag, exact: false },
  { to: "/admin/articles", label: "Articles", icon: FileText, exact: false },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/about", label: "About page", icon: Info, exact: false },
] as const;



function AdminLayout() {
  const { data: isAdmin, isLoading, refetch } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const claimFn = useServerFn(claimAdminIfNone);
  const claim = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: (r) => {
      if (r.promoted) toast.success("You are now an admin");
      else if (!r.alreadyAdmin)
        toast.info("Another admin already exists. Ask them to grant you access.");
      queryClient.invalidateQueries({ queryKey: ["is-admin"] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking access…
      </div>
    );

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md border-border/60 bg-card/40 p-8 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Admin Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need the admin role to access this area. If no admin exists yet, you can claim
          the first admin slot for this project.
        </p>
        <Button
          className="mt-4"
          onClick={() => claim.mutate(undefined)}
          disabled={claim.isPending}
        >
          {claim.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Shield className="mr-1 h-4 w-4" />
          )}
          Claim admin (first user only)
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Admin</h1>
      </div>
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-border/60 px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
