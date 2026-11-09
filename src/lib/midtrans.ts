import { createHash } from "node:crypto";
import { safeEqual } from "@/lib/password";

const SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const API_URL = "https://api.sandbox.midtrans.com/v2";

export type MidtransPayload = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  signature_key?: string;
  status_message?: string;
  va_numbers?: { bank: string; va_number: string }[];
  bank?: string;
};

export type MappedPayment = "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "IGNORE";

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY is not set");
  return key;
}

function authHeader(): string {
  return "Basic " + Buffer.from(serverKey() + ":").toString("base64");
}

/** Pure mapping from a Midtrans transaction status to our payment state. */
export function mapTransactionStatus(
  status: string | undefined,
  fraud: string | undefined
): MappedPayment {
  switch (status) {
    case "settlement":
      return "PAID";
    case "capture":
      if (fraud === "accept" || !fraud) return "PAID";
      if (fraud === "challenge") return "PENDING";
      return "FAILED";
    case "pending":
    case "authorize":
      return "PENDING";
    case "deny":
    case "cancel":
    case "failure":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    default:
      // refund, partial_refund, chargeback, unknown
      return "IGNORE";
  }
}

/** Customer-facing reason for a failed or expired Midtrans transaction status. */
export function failureReasonFor(status: string | undefined): string {
  switch (status) {
    case "deny":
      return "The payment was declined by the bank or the payment provider's fraud check.";
    case "cancel":
      return "The payment was cancelled before it was completed.";
    case "expire":
      return "The payment window expired before payment was completed.";
    case "failure":
      return "The payment provider could not process the payment.";
    default:
      return "The payment was declined, cancelled or could not be processed.";
  }
}

export function expectedSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  key: string
): string {
  return createHash("sha512")
    .update(orderId + statusCode + grossAmount + key)
    .digest("hex");
}

export function verifyNotificationSignature(
  p: MidtransPayload,
  key = serverKey()
): boolean {
  if (!p.order_id || !p.status_code || !p.gross_amount || !p.signature_key) return false;
  return safeEqual(
    expectedSignature(p.order_id, p.status_code, p.gross_amount, key),
    p.signature_key
  );
}

/** "50000.00" -> 50000 */
export function parseGross(gross: string | undefined): number {
  return Math.round(Number(gross ?? "NaN"));
}

export function paymentLabel(payload: MidtransPayload): string | null {
  if (!payload.payment_type) return null;
  const type = payload.payment_type.replace(/_/g, " ");
  const bank = payload.va_numbers?.[0]?.bank ?? payload.bank;
  return bank ? `${type} (${bank.toUpperCase()})` : type;
}

export type SnapInput = {
  orderId: string;
  amount: number;
  items: { id: string; name: string; price: number; quantity: number }[];
  customer: { name: string; email: string; phone?: string | null };
  finishUrl: string;
};

/**
 * Public HTTPS address Midtrans should send this transaction's notification to, or null
 * on a local machine (Midtrans cannot reach localhost; payment status polling covers it).
 * Sent per request, so a deployment works without editing the Midtrans dashboard.
 */
export function notificationUrlFor(appUrl: string | undefined): string | null {
  if (!appUrl || !/^https:\/\//i.test(appUrl)) return null;
  return `${appUrl.replace(/\/+$/, "")}/api/webhooks/midtrans`;
}

export async function createSnapTransaction(
  input: SnapInput
): Promise<{ token: string; redirectUrl: string }> {
  const notifyUrl = notificationUrlFor(process.env.APP_URL);
  const res = await fetch(SNAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
      ...(notifyUrl ? { "X-Override-Notification": notifyUrl } : {}),
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: input.items.map((i) => ({
        id: i.id.slice(0, 50),
        name: i.name.slice(0, 50),
        price: i.price,
        quantity: i.quantity,
      })),
      customer_details: {
        first_name: input.customer.name.slice(0, 50),
        email: input.customer.email,
        ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      },
      expiry: { unit: "minutes", duration: 60 },
      callbacks: { finish: input.finishUrl },
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };
  if (!res.ok || !data.token) {
    throw new Error(
      `Midtrans Snap error (${res.status}): ${data.error_messages?.join("; ") ?? "unknown"}`
    );
  }
  return { token: data.token, redirectUrl: data.redirect_url ?? "" };
}

/** Returns null when Midtrans has no such transaction yet (payment never started). */
export async function fetchTransactionStatus(
  orderId: string
): Promise<MidtransPayload | null> {
  const res = await fetch(`${API_URL}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as MidtransPayload | null;
  if (!data || data.status_code === "404") return null;
  return data;
}

/** Best-effort cancel/void; never throws. */
export async function cancelTransaction(orderId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: authHeader() },
      cache: "no-store",
    });
  } catch (e) {
    console.warn("Midtrans cancel failed", e);
  }
}
