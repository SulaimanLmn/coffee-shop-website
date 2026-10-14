import {
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";

const orderStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PREPARING: "bg-caramel/15 text-caramel-dark",
  READY: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentStyles: Record<PaymentStatus, string> = {
  UNPAID: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-red-100 text-red-700",
  REFUND_DUE: "bg-purple-100 text-purple-800",
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
                done ? "bg-caramel text-white" : "bg-foam text-mocha"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`text-xs ${done ? "text-espresso" : "text-mocha"}`}>
              {orderStatusLabel(step)}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`mx-1 h-px w-4 ${i < current ? "bg-caramel" : "bg-latte"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
