// Browser-side helper to load Razorpay Checkout script and open the modal.

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Razorpay Checkout"));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export async function openRazorpayCheckout(opts: {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  onSuccess: (r: RazorpaySuccess) => void;
  onDismiss?: () => void;
}): Promise<void> {
  await loadRazorpayCheckout();
  if (!window.Razorpay) throw new Error("Razorpay not loaded");
  const rzp = new window.Razorpay({
    key: opts.keyId,
    subscription_id: opts.subscriptionId,
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill ?? {},
    theme: { color: "#3b82f6" },
    handler: (response: RazorpaySuccess) => opts.onSuccess(response),
    modal: { ondismiss: () => opts.onDismiss?.() },
  });
  rzp.open();
}
