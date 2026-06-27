const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400">
        Production checkout is not configured yet. Complete payment go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-orange-500/30 bg-orange-500/10 px-4 py-2 text-center text-xs text-orange-300">
        Test mode — payments in the preview don't charge real money. Use card 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}
