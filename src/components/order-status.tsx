import {
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";

const orderStyles: Record<OrderStatus, string> = {
  PENDING: "bg-status-pending-soft text-status-pending-ink",
  PREPARING: "bg-status-preparing-soft text-status-preparing-ink",
  READY: "bg-status-ready-soft text-status-ready-ink",
  COMPLETED: "bg-status-completed-soft text-status-completed-ink",
  CANCELLED: "bg-status-cancelled-soft text-status-cancelled-ink",
};

/** Accent stripe colour for board cards and column headers. */
export const orderBarStyles: Record<OrderStatus, string> = {
  PENDING: "bg-status-pending",
  PREPARING: "bg-status-preparing",
  READY: "bg-status-ready",
  COMPLETED: "bg-status-completed",
  CANCELLED: "bg-status-cancelled",
};

const paymentStyles: Record<PaymentStatus, string> = {
  UNPAID: "bg-status-pending-soft text-status-pending-ink",
  PAID: "bg-status-completed-soft text-status-completed-ink",
  FAILED: "bg-status-cancelled-soft text-status-cancelled-ink",
  EXPIRED: "bg-status-cancelled-soft text-status-cancelled-ink",
  REFUND_DUE: "bg-purple-100 text-purple-900",
};

const badge = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={badge + orderStyles[status]}>{orderStatusLabel(status)}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={badge + paymentStyles[status]}>{paymentStatusLabel(status)}</span>;
}

const STEPS: OrderStatus[] = ["PENDING", "PREPARING", "READY", "COMPLETED"];

/** Progress tracker: Pending -> Preparing -> Ready for Pickup -> Completed. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") return null;
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              aria-current={i === current ? "step" : undefined}
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                done ? "bg-caramel-dark text-white" : "bg-foam text-mocha"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`text-xs ${done ? "text-espresso" : "text-mocha"}`}>
              {orderStatusLabel(step)}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`mx-1 h-px w-4 ${i < current ? "bg-caramel-dark" : "bg-latte"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
