export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUND_DUE",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Actor = "ADMIN" | "CUSTOMER";

const ORDER_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready for Pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  REFUND_DUE: "Refund due",
};

export function orderStatusLabel(s: OrderStatus): string {
  return ORDER_LABELS[s];
}
export function paymentStatusLabel(s: PaymentStatus): string {
  return PAYMENT_LABELS[s];
}

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export type TransitionResult = { ok: true } | { ok: false; reason: string };

/**
 * Single source of truth for who may move an order between statuses.
 * Admin: PENDING -> PREPARING -> READY (forward only, order must be paid).
 * Customer: PENDING -> CANCELLED, READY -> COMPLETED.
 */
export function checkTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
  paymentStatus: PaymentStatus
): TransitionResult {
  if (actor === "ADMIN") {
    if (paymentStatus !== "PAID") {
      return { ok: false, reason: "Only paid orders can be processed." };
    }
    if (from === "PENDING" && to === "PREPARING") return { ok: true };
    if (from === "PREPARING" && to === "READY") return { ok: true };
    return { ok: false, reason: `Cannot change ${ORDER_LABELS[from]} to ${ORDER_LABELS[to]}.` };
  }
  if (from === "PENDING" && to === "CANCELLED") return { ok: true };
  if (from === "READY" && to === "COMPLETED") {
    return paymentStatus === "PAID"
      ? { ok: true }
      : { ok: false, reason: "This order has not been paid." };
  }
  if (to === "CANCELLED") {
    return { ok: false, reason: "Orders can only be cancelled while Pending." };
  }
  return { ok: false, reason: `Cannot change ${ORDER_LABELS[from]} to ${ORDER_LABELS[to]}.` };
}

/** Admin-selectable next statuses for the order-management dropdown. */
export function adminNextStatuses(from: OrderStatus): OrderStatus[] {
  if (from === "PENDING") return ["PREPARING"];
  if (from === "PREPARING") return ["READY"];
  return [];
}

export function statusTimestampField(
  status: OrderStatus
): "preparingAt" | "readyAt" | "completedAt" | "cancelledAt" | null {
  switch (status) {
    case "PREPARING":
      return "preparingAt";
    case "READY":
      return "readyAt";
    case "COMPLETED":
      return "completedAt";
    case "CANCELLED":
      return "cancelledAt";
    default:
      return null;
  }
}

/** Public-facing order number, e.g. BH-K3J9X2AB. */
export function orderNumber(midtransOrderId: string): string {
  return midtransOrderId;
}

export function newMidtransOrderId(): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32])
    .join("");
  return `BH-${rand}${Date.now().toString(36).toUpperCase().slice(-3)}`;
}
