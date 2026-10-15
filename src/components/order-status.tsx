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

export type StepTimes = Partial<Record<OrderStatus, Date | null>>;

const stepTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * Progress tracker: Pending -> Preparing -> Ready for Pickup -> Completed.
 * Pass `times` to show when each step happened.
 */
export function OrderProgress({ status, times }: { status: OrderStatus; times?: StepTimes }) {
  if (status === "CANCELLED") return null;
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap items-start gap-x-1 gap-y-2" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const at = times?.[step];
        return (
          <li
            key={step}
            aria-current={i === current ? "step" : undefined}
            className="flex items-start gap-1"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  done ? "bg-caramel-dark text-white" : "bg-foam text-mocha"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </span>
              <span className="flex flex-col leading-tight">
                <span className={`text-xs font-medium ${done ? "text-espresso" : "text-mocha"}`}>
                  {orderStatusLabel(step)}
                </span>
                {done && at && (
                  <span className="text-[11px] tabular-nums text-mocha">{stepTime.format(at)}</span>
                )}
                <span className="sr-only">
                  Step {i + 1} of {STEPS.length}
                  {i < current ? ", done" : i === current ? ", current" : ", not yet"}
                </span>
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-1 mt-3.5 h-px w-4 ${i < current ? "bg-caramel-dark" : "bg-latte"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
