import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listUsers, setUserRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsers);
  const setRoleFn = useServerFn(setUserRole);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (args: { userId: string; action: "grant" | "revoke" }) =>
      setRoleFn({ data: { userId: args.userId, role: "admin", action: args.action } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (u.email ?? "").toLowerCase().includes(s) ||
      (u.full_name ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Card className="grid h-24 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No users found.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-border/60 bg-card/40 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{u.full_name ?? "—"}</p>
                    {isAdmin && <Badge className="bg-primary/15 text-primary">Admin</Badge>}
                    <Badge variant="outline" className="capitalize">{u.plan ?? "free"}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  {u.target_exam && (
                    <p className="text-xs text-muted-foreground">Target: {u.target_exam}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isAdmin ? "outline" : "default"}
                  disabled={mutate.isPending}
                  onClick={() =>
                    mutate.mutate({ userId: u.id, action: isAdmin ? "revoke" : "grant" })
                  }
                >
                  {isAdmin ? (
                    <><ShieldOff className="mr-1 h-4 w-4" /> Revoke admin</>
                  ) : (
                    <><Shield className="mr-1 h-4 w-4" /> Make admin</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
