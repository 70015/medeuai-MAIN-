import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  createPromoCode,
  deletePromoCode,
  togglePromoCode,
} from "@/lib/promo.functions";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  head: () => ({ meta: [{ title: "Promo Codes — Admin" }] }),
  component: PromosPage,
});

type GrantType = "pro_monthly" | "pro_yearly" | "custom" | "discount";

function PromosPage() {
  const qc = useQueryClient();
  const createFn = useServerFn(createPromoCode);
  const toggleFn = useServerFn(togglePromoCode);
  const deleteFn = useServerFn(deletePromoCode);

  const [code, setCode] = useState("");
  const [grantType, setGrantType] = useState<GrantType>("pro_monthly");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [planTier, setPlanTier] = useState<"pro_monthly" | "pro_yearly">("pro_monthly");
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const { data: codes, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code,
          grant_type: grantType,
          duration_days:
            grantType === "pro_monthly"
              ? 30
              : grantType === "pro_yearly"
                ? 365
                : grantType === "custom"
                  ? durationDays
                  : null,
          plan_tier: grantType === "custom" ? planTier : null,
          discount_percent: grantType === "discount" ? discountPercent : null,
          expires_at: expiresAt || null,
          notes: notes || null,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Created ${r.code}`);
      setCode("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-codes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Create promo code</h2>
        </div>
        <div className="space-y-3">
          <Field label="Code">
            <Input
              placeholder="WELCOME50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={64}
            />
          </Field>
          <Field label="Grant type">
            <Select value={grantType} onValueChange={(v) => setGrantType(v as GrantType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pro_monthly">Free Pro Monthly (30 days)</SelectItem>
                <SelectItem value="pro_yearly">Free Pro Yearly (365 days)</SelectItem>
                <SelectItem value="custom">Custom duration + tier</SelectItem>
                <SelectItem value="discount">Percent discount at checkout</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {grantType === "custom" && (
            <>
              <Field label="Plan tier">
                <Select value={planTier} onValueChange={(v) => setPlanTier(v as typeof planTier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro_monthly">Pro Monthly</SelectItem>
                    <SelectItem value="pro_yearly">Pro Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Duration (days)">
                <Input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
            </>
          )}
          {grantType === "discount" && (
            <Field label="Discount percent (1-100)">
              <Input
                type="number"
                min={1}
                max={100}
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                }
              />
            </Field>
          )}
          <Field label="Expires at (optional)">
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
          <Field label="Notes (internal)">
            <Input
              placeholder="Campaign / partner / etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </Field>
          <Button
            className="w-full"
            disabled={!code.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 h-4 w-4" />
            )}
            Create code
          </Button>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Active codes</h2>
        </div>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded bg-muted/40" />
        ) : (codes ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No promo codes yet.</p>
        ) : (
          <div className="space-y-2">
            {(codes ?? []).map((c) => {
              const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
              return (
                <div
                  key={c.id}
                  className="rounded-md border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm font-semibold tracking-wider">
                        {c.code}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.grant_type === "discount"
                            ? `${c.discount_percent}% off`
                            : c.grant_type === "custom"
                              ? `${c.plan_tier} · ${c.duration_days}d`
                              : c.grant_type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Used {c.redemption_count}×
                        </Badge>
                        {expired && (
                          <Badge variant="destructive" className="text-[10px]">expired</Badge>
                        )}
                      </div>
                      {c.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>
                      )}
                      {c.expires_at && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Expires {new Date(c.expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={c.active}
                          onCheckedChange={(v) =>
                            toggle.mutate({ id: c.id, active: v })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {c.active ? "On" : "Off"}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete ${c.code}?`)) del.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
