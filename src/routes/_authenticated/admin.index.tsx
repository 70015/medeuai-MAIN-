import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileQuestion, HelpCircle, Users, ClipboardCheck, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualUpiPayments } from "@/components/admin/manual-upi-payments";
import { getAdminStats } from "@/lib/admin.functions";
import { ensureRazorpayPlans } from "@/lib/razorpay.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — MedEu.Ai" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(getAdminStats);
  const ensurePlansFn = useServerFn(ensureRazorpayPlans);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fn(),
  });

  const ensurePlans = useMutation({
    mutationFn: () => ensurePlansFn(),
    onSuccess: (r) => {
      const created = r.plans.filter((p) => p.created).length;
      toast.success(
        created > 0
          ? `Created ${created} plan(s) in Razorpay.`
          : "Plans already initialized in Razorpay.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={Users} label="Total Users" value={data?.users} loading={isLoading} />
        <Tile
          icon={FileQuestion}
          label="Approved Questions"
          value={data?.approvedQuestions}
          loading={isLoading}
          tint="success"
        />
        <Tile
          icon={HelpCircle}
          label="Pending Review"
          value={data?.pendingQuestions}
          loading={isLoading}
          tint="warning"
        />
        <Tile
          icon={ClipboardCheck}
          label="Tests Completed"
          value={data?.attempts}
          loading={isLoading}
        />
      </div>

      <Card className="border-border/60 bg-card/40 p-6">
        <h2 className="text-base font-semibold">Quick start</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The question bank powers every mock test. Generate a batch with AI to populate it,
          then approve the ones you like.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/admin/generate">
            <Button>Generate AI questions</Button>
          </Link>
          <Link to="/admin/review">
            <Button variant="outline">Review queue ({data?.pendingQuestions ?? 0})</Button>
          </Link>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4" /> Manual UPI payments
          </h2>
          <Link to="/admin/payments" className="text-sm font-medium text-primary underline">
            Open full page
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Payment settings &amp; requests — configure your UPI ID, plan prices and QR codes,
          and verify or reject pending payment requests from students.
        </p>
        <ManualUpiPayments />
      </section>

      <Card className="border-border/60 bg-card/40 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CreditCard className="h-4 w-4" /> Razorpay</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Run this once to create the Pro Monthly (₹99) and Pro Yearly (₹799) plans in your
          Razorpay account. Idempotent — safe to re-run.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => ensurePlans.mutate()}
          disabled={ensurePlans.isPending}
        >
          {ensurePlans.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : null}
          Initialize Razorpay plans
        </Button>
      </Card>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  loading,
  tint = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
  tint?: "primary" | "success" | "warning";
}) {
  const cls =
    tint === "success"
      ? "bg-success/15 text-success"
      : tint === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/15 text-primary";
  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${cls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-bold">{loading ? "…" : (value ?? 0)}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </Card>
  );
}
