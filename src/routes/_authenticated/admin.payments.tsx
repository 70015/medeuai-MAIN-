import { createFileRoute } from "@tanstack/react-router";

import { ManualUpiPayments } from "@/components/admin/manual-upi-payments";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — MedEu.Ai Admin" }] }),
  component: AdminPaymentsРRoute,
});

function AdminPaymentsРRoute() {
  return <ManualUpiPayments />;
}
