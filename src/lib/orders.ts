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

/** Admin-selectable next statuses (at most one: the admin only moves orders forward). */
export function adminNextStatuses(from: OrderStatus): OrderStatus[] {
  if (from === "PENDING") return ["PREPARING"];
  if (from === "PREPARING") return ["READY"];
  return [];
}

/** Button text for the admin's one-click action that moves an order to `to`. */
export function adminActionLabel(to: OrderStatus): string {
  if (to === "PREPARING") return "Start preparing";
  if (to === "READY") return "Mark ready";
  return `Mark as ${ORDER_LABELS[to]}`;
}

// ---------- Admin order management (live board + history) ----------

export const BOARD_STATUSES = ["PENDING", "PREPARING", "READY"] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

/** Group live orders into board columns, soonest pickup first. */
export function boardColumns<T extends { orderStatus: OrderStatus; pickupTime: Date }>(
  orders: T[]
): Record<BoardStatus, T[]> {
  const columns: Record<BoardStatus, T[]> = { PENDING: [], PREPARING: [], READY: [] };
  for (const o of orders) {
    if ((BOARD_STATUSES as readonly string[]).includes(o.orderStatus)) {
      columns[o.orderStatus as BoardStatus].push(o);
    }
  }
  for (const key of BOARD_STATUSES) {
    columns[key].sort((a, b) => a.pickupTime.getTime() - b.pickupTime.getTime());
  }
  return columns;
}

export const ADMIN_HISTORY_PAGE_SIZE = 25;

export type AdminOrdersView = {
  view: "board" | "history";
  status: OrderStatus | null;
  q: string;
  page: number;
  /** Order id shown in the detail drawer. */
  order: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function parseAdminOrdersView(sp: RawParams): AdminOrdersView {
  const page = Number.parseInt(firstParam(sp.page), 10);
  const status = firstParam(sp.status);
  return {
    view: firstParam(sp.view) === "history" ? "history" : "board",
    status: isOrderStatus(status) ? status : null,
    q: firstParam(sp.q).trim().slice(0, 60),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
    order: firstParam(sp.order).slice(0, 40) || null,
  };
}

/** Build a /admin/orders URL, leaving out values that are the default. */
export function adminOrdersHref(next: Partial<AdminOrdersView>): string {
  const params = new URLSearchParams();
  if (next.view === "history") params.set("view", "history");
  if (next.status) params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  if (next.order) params.set("order", next.order);
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
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
