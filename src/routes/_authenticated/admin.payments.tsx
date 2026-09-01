import { createFileRoute } from "@tanstack/react-router";

import { ManualUpiPayments } from "@/components/admin/manual-upi-payments";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payments | MedEuAi Admin" }] }),
  component: AdminPaymentsRoute,
});

function AdminPaymentsRoute() {
  return <ManualUpiPayments />;
}
