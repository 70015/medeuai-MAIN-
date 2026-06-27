import { createFileRoute } from "@tanstack/react-router";

async function handleSubscriptionEvent(eventType: string, sub: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const status =
    eventType === "subscription.cancelled"
      ? "cancelled"
      : eventType === "subscription.completed"
        ? "completed"
        : eventType === "subscription.halted"
          ? "halted"
          : sub.status;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      current_period_start: sub.current_start
        ? new Date(sub.current_start * 1000).toISOString()
        : null,
      current_period_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
      cancel_at_period_end: eventType === "subscription.cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", sub.id);
}

export const Route = createFileRoute("/api/public/payments/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        try {
          const { verifyWebhookSignature } = await import("@/lib/razorpay.server");
          const ok = await verifyWebhookSignature(body, signature);
          if (!ok) return new Response("Invalid signature", { status: 401 });

          const event = JSON.parse(body);
          const type: string = event.event;

          if (type.startsWith("subscription.")) {
            const sub = event.payload?.subscription?.entity;
            if (sub) await handleSubscriptionEvent(type, sub);
          } else {
            console.log("Unhandled Razorpay event:", type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Razorpay webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
