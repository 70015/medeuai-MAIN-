import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  Save,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  getPaymentSettings,
  getProofUrl,
  listPaymentRequests,
  reviewPaymentRequest,
  savePaymentSettings,
} from "@/lib/payments.functions";

const QR_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ManualUpiPayments() {
  const queryClient = useQueryClient();
  const settingsFn = useServerFn(getPaymentSettings);
  const saveFn = useServerFn(savePaymentSettings);
  const listFn = useServerFn(listPaymentRequests);
  const reviewFn = useServerFn(reviewPaymentRequest);
  const proofFn = useServerFn(getProofUrl);

  const { data: settings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => settingsFn(),
  });
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-payment-requests"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState({
    merchant_name: "MedEuAi",
    upi_id: "",
    monthly_price_inr: 99,
    yearly_price_inr: 799,
    monthly_qr_path: null as string | null,
    yearly_qr_path: null as string | null,
    upi_intent_enabled: true,
    qr_enabled: true,
    instructions: "",
    free_attempts_allowed: 3,
    free_window_days: 30,
    free_ai_daily_limit: 10,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      merchant_name: settings.merchantName,
      upi_id: settings.upiId,
      monthly_price_inr: settings.monthlyPriceInr,
      yearly_price_inr: settings.yearlyPriceInr,
      monthly_qr_path: settings.monthlyQrPath,
      yearly_qr_path: settings.yearlyQrPath,
      upi_intent_enabled: settings.upiIntentEnabled,
      qr_enabled: settings.qrEnabled,
      instructions: settings.instructions,
      free_attempts_allowed: settings.freeAttemptsAllowed,
      free_window_days: settings.freeWindowDays,
      free_ai_daily_limit: settings.freeAiDailyLimit,
    });
  }, [settings]);


  const save = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("Payment settings saved");
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (v: { id: string; action: "verify" | "reject"; note?: string }) =>
      reviewFn({ data: v }),
    onSuccess: (r) => {
      toast.success(
        r.status === "verified"
          ? `Payment verified, access until ${r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "period end"}`
          : "Payment request rejected",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openProof(path: string) {
    try {
      const { url } = await proofFn({ data: { path } });
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Could not open the screenshot");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const reviewed = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/40 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CreditCard className="h-4 w-4 text-[#03824F]" /> Payment settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manual UPI collection. Users pay to this UPI ID and submit their transaction ID for
          verification.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="merchant">Merchant name</Label>
            <Input
              id="merchant"
              value={form.merchant_name}
              onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="upi">UPI ID</Label>
            <Input
              id="upi"
              value={form.upi_id}
              placeholder="name@bank"
              onChange={(e) => setForm({ ...form, upi_id: e.target.value.trim() })}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthly">Monthly price (₹)</Label>
            <Input
              id="monthly"
              type="number"
              min={1}
              value={form.monthly_price_inr}
              onChange={(e) =>
                setForm({ ...form, monthly_price_inr: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearly">Yearly price (₹)</Label>
            <Input
              id="yearly"
              type="number"
              min={1}
              value={form.yearly_price_inr}
              onChange={(e) => setForm({ ...form, yearly_price_inr: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="instructions">Instructions shown to users</Label>
          <Textarea
            id="instructions"
            rows={4}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="1. Pay the exact amount to the UPI ID above. 2. Copy the UTR from your UPI app. 3. Submit it here, we verify within a few hours."
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="UPI app button"
            hint="Show a one-tap 'Pay in UPI app' button"
            checked={form.upi_intent_enabled}
            onChange={(v) => setForm({ ...form, upi_intent_enabled: v })}
          />
          <ToggleRow
            label="QR codes"
            hint="Show the uploaded QR code on the payment page"
            checked={form.qr_enabled}
            onChange={(v) => setForm({ ...form, qr_enabled: v })}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <QrUploader
            label="Monthly plan QR"
            path={form.monthly_qr_path}
            onChange={(p) => setForm({ ...form, monthly_qr_path: p })}
          />
          <QrUploader
            label="Yearly plan QR"
            path={form.yearly_qr_path}
            onChange={(p) => setForm({ ...form, yearly_qr_path: p })}
          />
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
          <h3 className="text-sm font-semibold">Free plan limits</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Controls what students get before upgrading. Changes apply instantly.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="free_attempts">Free mock tests</Label>
              <Input
                id="free_attempts"
                type="number"
                min={0}
                value={form.free_attempts_allowed}
                onChange={(e) =>
                  setForm({ ...form, free_attempts_allowed: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="free_window">Window (days)</Label>
              <Input
                id="free_window"
                type="number"
                min={1}
                value={form.free_window_days}
                onChange={(e) =>
                  setForm({ ...form, free_window_days: Number(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="free_ai">AI questions / day</Label>
              <Input
                id="free_ai"
                type="number"
                min={0}
                value={form.free_ai_daily_limit}
                onChange={(e) =>
                  setForm({ ...form, free_ai_daily_limit: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>



        <Button
          className="mt-6 bg-[#03824F] text-white hover:bg-[#02663E]"
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.upi_id}
        >
          {save.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save settings
        </Button>
      </Card>

      <Card className="border-border/60 bg-card/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Payment requests</h2>
          <Badge variant="outline" className="border-[#02663E]/40 text-[#02663E] dark:text-primary">
            {pending.length} pending
          </Badge>
        </div>

        {isLoading ? (
          <div className="mt-4 h-24 animate-pulse rounded-lg bg-muted/40" />
        ) : !requests?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No payment requests yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {[...pending, ...reviewed].map((r) => (
              <RequestRow
                key={r.id}
                r={r}
                busy={review.isPending}
                onOpenProof={openProof}
                onReview={(action, note) => review.mutate({ id: r.id, action, note })}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function QrUploader({
  label,
  path,
  onChange,
}: {
  label: string;
  path: string | null;
  onChange: (p: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: url } = useQuery({
    queryKey: ["payment-qr", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage
        .from("payment-qr")
        .createSignedUrl(path!, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!QR_ACCEPTED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const newPath = `qr/${label.toLowerCase().includes("year") ? "yearly" : "monthly"}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("payment-qr")
        .upload(newPath, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      onChange(newPath);
      toast.success(`${label} uploaded, remember to save settings`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <QrCode className="h-4 w-4 text-[#03824F]" /> {label}
      </div>
      {url ? (
        <img
          src={url}
          alt={`${label} preview`}
          className="mx-auto mt-3 h-32 w-32 rounded-md border border-border/60 bg-white object-contain p-1"
        />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No QR uploaded.</p>
      )}
      <input
        ref={ref}
        type="file"
        accept={QR_ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          Upload
        </Button>
        {path && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

type RequestItem = Awaited<ReturnType<typeof listPaymentRequests>>[number];

function RequestRow({
  r,
  busy,
  onReview,
  onOpenProof,
}: {
  r: RequestItem;
  busy: boolean;
  onReview: (action: "verify" | "reject", note?: string) => void;
  onOpenProof: (path: string) => void;
}) {
  const [note, setNote] = useState("");
  const isPending = r.status === "pending";

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {r.user_name ?? r.user_email ?? r.user_id.slice(0, 8)}
            <span className="ml-2 font-normal text-muted-foreground">
              {r.plan === "pro_yearly" ? "Pro Yearly" : "Pro Monthly"} · ₹{r.amount_inr}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            UTR <span className="font-mono">{r.utr}</span> · paid{" "}
            {new Date(r.paid_on).toLocaleDateString()} · submitted{" "}
            {new Date(r.created_at).toLocaleString()}
          </div>
          {r.user_email && (
            <div className="text-xs text-muted-foreground">{r.user_email}</div>
          )}
        </div>
        <StatusPill status={r.status} />
      </div>

      {r.screenshot_path && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => onOpenProof(r.screenshot_path!)}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View screenshot
        </Button>
      )}

      {isPending ? (
        <div className="mt-3 space-y-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional, shown to the user if rejected)"
            maxLength={500}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-[#03824F] text-white hover:bg-[#02663E]"
              disabled={busy}
              onClick={() => onReview("verify", note || undefined)}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Verify & activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => onReview("reject", note || undefined)}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </div>
      ) : (
        r.admin_note && (
          <p className="mt-2 text-xs text-muted-foreground">Note: {r.admin_note}</p>
        )
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "verified")
    return <Badge className="bg-[#03824F] text-white hover:bg-[#02663E]">Verified</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return (
    <Badge variant="outline" className="border-[#02663E]/40 text-[#02663E] dark:text-primary">
      Pending
    </Badge>
  );
}
