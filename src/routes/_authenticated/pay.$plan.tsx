import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Check,
  Clock,
  Copy,
  Info,
  Loader2,
  QrCode,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackLink } from "@/components/back-link";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyPaymentRequests,
  getPaymentSettings,
  submitPaymentRequest,
  type PlanKey,
} from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/pay/$plan")({
  head: () => ({
    meta: [
      { title: "Complete your payment | MedEuAi" },
      {
        name: "description",
        content:
          "Pay for MedEuAi Pro with any UPI app and submit your transaction ID for verification.",
      },
    ],
  }),
  component: PayPage,
});

const PLAN_LABEL: Record<PlanKey, { name: string; cadence: string }> = {
  pro_monthly: { name: "Pro Monthly", cadence: "1 month of access" },
  pro_yearly: { name: "Pro Yearly", cadence: "12 months of access" },
};

const PROOF_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

function PayPage() {
  const { plan: rawPlan } = useParams({ from: "/_authenticated/pay/$plan" });
  const plan: PlanKey = rawPlan === "pro_yearly" ? "pro_yearly" : "pro_monthly";
  const queryClient = useQueryClient();

  const settingsFn = useServerFn(getPaymentSettings);
  const requestsFn = useServerFn(getMyPaymentRequests);
  const submitFn = useServerFn(submitPaymentRequest);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => settingsFn(),
  });
  const { data: myRequests } = useQuery({
    queryKey: ["my-payment-requests"],
    queryFn: () => requestsFn(),
  });

  const amount = settings
    ? plan === "pro_yearly"
      ? settings.yearlyPriceInr
      : settings.monthlyPriceInr
    : null;
  const qrPath = plan === "pro_yearly" ? settings?.yearlyQrPath : settings?.monthlyQrPath;

  const { data: qrUrl } = useQuery({
    queryKey: ["payment-qr", qrPath],
    enabled: !!qrPath && !!settings?.qrEnabled,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("payment-qr")
        .createSignedUrl(qrPath!, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });

  const pending = myRequests?.find((r) => r.status === "pending");
  const lastRejected =
    !pending && myRequests?.[0]?.status === "rejected" ? myRequests[0] : null;

  const [showForm, setShowForm] = useState(false);
  const [utr, setUtr] = useState("");
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useMutation({
    mutationFn: async () => {
      let screenshotPath: string | null = null;
      if (file) {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) throw new Error("Please sign in again");
        const ext =
          file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${uid}/proof-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        screenshotPath = path;
      }
      return submitFn({
        data: { plan, utr, paid_on: paidOn, screenshot_path: screenshotPath },
      });
    },
    onSuccess: () => {
      toast.success("Submitted for verification");
      setShowForm(false);
      setUtr("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["my-payment-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upiLink =
    settings?.upiIntentEnabled && settings.upiId && amount
      ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
          settings.merchantName,
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`MedEuAi ${PLAN_LABEL[plan].name}`)}`
      : null;

  function copyUpi() {
    if (!settings?.upiId) return;
    navigator.clipboard
      .writeText(settings.upiId)
      .then(() => toast.success("UPI ID copied"))
      .catch(() => toast.error("Could not copy, please copy manually"));
  }

  function pickFile(selected: File | undefined) {
    if (!selected) return;
    if (!PROOF_ACCEPTED.includes(selected.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (selected.size > PROOF_MAX_BYTES) {
      toast.error("That image is larger than 5 MB.");
      return;
    }
    setFile(selected);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 pb-24">
      <BackLink to="/billing" label="Back to Billing" />

      <div>
        <Badge className="bg-[#EAF7F1] text-[#04211C] hover:bg-[#EAF7F1]">
          {PLAN_LABEL[plan].name}
        </Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Complete your payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLAN_LABEL[plan].cadence} · activated after manual verification.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      ) : !settings?.upiId ? (
        <Card className="border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
          Payments are not configured yet. Please contact support at{" "}
          <a className="font-medium text-[#03824F] underline" href="mailto:hello.medeu.ai@gmail.com">
            hello.medeu.ai@gmail.com
          </a>
          .
        </Card>
      ) : (
        <>
          <Card className="border-border/60 bg-card/40 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">Amount to pay</span>
              <span className="text-3xl font-bold tracking-tight">₹{amount}</span>
            </div>

            <div className="mt-4 rounded-lg border border-border/60 bg-[#EAF7F1] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[#02663E] dark:text-primary">
                Pay to
              </div>
              <div className="mt-1 text-sm font-semibold text-[#04211C]">
                {settings.merchantName}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-white px-2.5 py-2 font-mono text-sm text-[#04211C]">
                  {settings.upiId}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUpi}
                  className="shrink-0 border-[#02663E]/30 bg-white text-[#02663E] hover:bg-[#EAF7F1]"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            </div>

            {upiLink ? (
              <a href={upiLink} className="mt-4 block">
                <Button className="w-full bg-[#03824F] text-white hover:bg-[#02663E]">
                  <Smartphone className="mr-1.5 h-4 w-4" /> Pay ₹{amount} in a UPI app
                </Button>
              </a>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Opening a UPI app directly is unavailable. Scan the QR code or copy the UPI ID
                above and pay from your UPI app.
              </p>
            )}

            <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Leaving for a UPI app and returning does not verify your payment. Access is granted
              only after an admin verifies your transaction ID.
            </p>
          </Card>

          {settings.qrEnabled && (
            <Card className="border-border/60 bg-card/40 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-[#03824F]" /> Scan to pay ({PLAN_LABEL[plan].name})
              </h2>
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`UPI QR code for the ${PLAN_LABEL[plan].name} plan`}
                  className="mx-auto mt-4 h-auto w-full max-w-[260px] rounded-lg border border-border/60 bg-white object-contain p-2"
                />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  A QR code for this plan hasn't been added yet, use the UPI ID above instead.
                </p>
              )}
            </Card>
          )}

          {settings.instructions && (
            <Card className="border-border/60 bg-card/40 p-5">
              <h2 className="text-sm font-semibold">How it works</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {settings.instructions}
              </p>
            </Card>
          )}

          {pending ? (
            <Card className="border-[#03824F]/40 bg-[#EAF7F1] p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#04211C] dark:text-foreground">
                <Clock className="h-4 w-4" /> Awaiting verification
              </h2>
              <p className="mt-2 text-sm text-[#33403D]">
                We received your {PLAN_LABEL[pending.plan as PlanKey]?.name ?? pending.plan}{" "}
                payment of ₹{pending.amount_inr} (UTR {pending.utr}). An admin will verify it
                shortly, you'll get Pro access as soon as it's approved.
              </p>
            </Card>
          ) : (
            <Card className="border-border/60 bg-card/40 p-5">
              {lastRejected && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <XCircle className="h-4 w-4" /> Last request was rejected
                  </span>
                  {lastRejected.admin_note && (
                    <p className="mt-1 text-xs">{lastRejected.admin_note}</p>
                  )}
                  <p className="mt-1 text-xs">You can submit a new request below.</p>
                </div>
              )}

              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck className="h-4 w-4 text-[#03824F]" /> Already paid? Submit for
                verification
              </h2>

              {!showForm ? (
                <Button
                  className="mt-4 w-full bg-[#04211C] text-white hover:bg-[#02663E] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                  onClick={() => setShowForm(true)}
                >
                  Submit for verification
                </Button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Plan</span>{" "}
                    <span className="font-semibold">{PLAN_LABEL[plan].name}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">Amount</span>{" "}
                    <span className="font-semibold">₹{amount}</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="utr">UTR / transaction ID *</Label>
                    <Input
                      id="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.trim())}
                      placeholder="e.g. 402312345678"
                      inputMode="numeric"
                      maxLength={64}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="paid-on">Payment date *</Label>
                    <Input
                      id="paid-on"
                      type="date"
                      value={paidOn}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setPaidOn(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proof">Payment screenshot (optional)</Label>
                    <input
                      ref={fileRef}
                      id="proof"
                      type="file"
                      accept={PROOF_ACCEPTED.join(",")}
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start border-border/60"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-4 w-4" />
                      <span className="truncate">{file ? file.name : "Choose an image"}</span>
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG or WebP · up to 5 MB.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-[#03824F] text-white hover:bg-[#02663E]"
                      disabled={utr.length < 6 || !paidOn || submit.isPending}
                      onClick={() => submit.mutate()}
                    >
                      {submit.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1.5 h-4 w-4" />
                      )}
                      Submit for verification
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      disabled={submit.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {!!myRequests?.length && (
            <Card className="border-border/60 bg-card/40 p-5">
              <h2 className="text-sm font-semibold">Your payment history</h2>
              <ul className="mt-3 space-y-2">
                {myRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">
                        {PLAN_LABEL[r.plan as PlanKey]?.name ?? r.plan}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · ₹{r.amount_inr} · {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Questions? Email{" "}
                <a
                  className="font-medium text-[#03824F] underline"
                  href="mailto:hello.medeu.ai@gmail.com"
                >
                  hello.medeu.ai@gmail.com
                </a>
                .
              </p>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Once verified, your plan appears on the{" "}
            <Link to="/billing" className="font-medium text-[#03824F] underline">
              Billing page
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return <Badge className="bg-[#03824F] text-white hover:bg-[#02663E]">Verified</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return (
    <Badge variant="outline" className="border-[#02663E]/40 text-[#02663E] dark:text-primary">
      Pending
    </Badge>
  );
}
