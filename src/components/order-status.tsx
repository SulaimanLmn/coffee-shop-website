import type { OrderStatus } from "@/lib/catalog";
import { statusLabel, FULFILLMENT_FLOW } from "@/lib/catalog";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  ROASTING: "bg-caramel/15 text-caramel-dark",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-espresso/10 text-espresso",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function OrderTimeline({
  status,
}: {
  status: OrderStatus;
}) {
  if (status === "CANCELLED" || status === "PENDING") {
    return null;
  }
  const steps = FULFILLMENT_FLOW;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-caramel text-white"
                  : "bg-foam text-mocha"
              } ${active ? "ring-2 ring-caramel/30" : ""}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`hidden text-xs sm:inline ${
                done ? "text-espresso" : "text-mocha"
              }`}
            >
              {step.charAt(0) + step.slice(1).toLowerCase()}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`mx-1 h-px w-4 sm:w-8 ${
                  i < currentIndex ? "bg-caramel" : "bg-latte"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
