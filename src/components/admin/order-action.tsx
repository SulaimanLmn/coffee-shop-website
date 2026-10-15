import { adminActionLabel, adminNextStatuses, type OrderStatus } from "@/lib/orders";
import { adminUpdateOrderStatusAction } from "@/lib/actions/orders";
import { SubmitButton } from "@/components/submit-button";

/**
 * The admin's one-click action for an order: Pending -> Start preparing,
 * Preparing -> Mark ready. Ready orders wait for the customer (spec 3.2).
 */
export function OrderActionForm({
  orderId,
  orderStatus,
  returnTo,
  className,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  returnTo: string;
  className?: string;
}) {
  const [next] = adminNextStatuses(orderStatus);
  if (!next) {
    return orderStatus === "READY" ? (
      <p className="text-sm font-medium text-status-ready-ink">Waiting for customer</p>
    ) : null;
  }
  return (
    <form action={adminUpdateOrderStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={next} />
      <input type="hidden" name="return" value={returnTo} />
      <SubmitButton
        pendingLabel="Updating…"
        className={
          className ??
          "inline-flex items-center justify-center rounded-full bg-caramel-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coffee disabled:cursor-wait disabled:opacity-70"
        }
      >
        {adminActionLabel(next)}
      </SubmitButton>
    </form>
  );
}
