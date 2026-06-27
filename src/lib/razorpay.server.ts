// Server-only Razorpay helpers. Use fetch + Web Crypto for Worker compatibility.

const RZP_BASE = "https://api.razorpay.com/v1";

function getKeys() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys are not configured");
  return { id, secret };
}

function authHeader() {
  const { id, secret } = getKeys();
  const token = btoa(`${id}:${secret}`);
  return `Basic ${token}`;
}

export function getRazorpayKeyId(): string {
  return getKeys().id;
}

export function getRazorpayEnvironment(): "test" | "live" {
  return getKeys().id.startsWith("rzp_live_") ? "live" : "test";
}

export async function rzpFetch<T = any>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${RZP_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.error?.description || json?.error?.message || text || res.statusText;
    throw new Error(`Razorpay ${res.status}: ${msg}`);
  }
  return json as T;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySubscriptionPaymentSignature(opts: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  const { secret } = getKeys();
  const payload = `${opts.razorpay_payment_id}|${opts.razorpay_subscription_id}`;
  const expected = await hmacSha256Hex(secret, payload);
  return timingSafeEqualHex(expected, opts.razorpay_signature);
}

export async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
  const expected = await hmacSha256Hex(secret, body);
  return timingSafeEqualHex(expected, signature);
}
