import { cancelOrderAction, confirmReceivedAction } from "@/lib/actions/orders";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";
import { ConfirmButton } from "./confirm-button";
import { PayButton } from "./snap-pay";
import { SubmitButton } from "./submit-button";
import { primaryButtonClass, secondaryButtonClass } from "./form-kit";

type Props = {
  order: {
    id: string;
    midtransOrderId: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
  };
  returnTo: string;
  /** Smaller buttons for table rows and cards. */
  compact?: boolean;
  /** Which actions to offer; defaults to all that apply. */
  only?: ("pay" | "cancel" | "confirm")[];
};

/** The customer's next step on an order: Pay now, Cancel (while Pending) or Confirm Received. */
export function OrderActions({ order, returnTo, compact, only }: Props) {
  const allow = (a: "pay" | "cancel" | "confirm") => !only || only.includes(a);
  const canPay = order.paymentStatus === "UNPAID" && order.orderStatus === "PENDING";
  const canCancel = order.orderStatus === "PENDING";
  const canConfirm = order.orderStatus === "READY" && order.paymentStatus === "PAID";

  const size = compact ? "!px-4 !py-1.5" : "";
  const primary = `${primaryButtonClass} ${size}`;
  const secondary = `${secondaryButtonClass} ${size}`;
  const paid = order.paymentStatus === "PAID";

  return (
    <>
      {allow("pay") && canPay && (
        <PayButton orderId={order.midtransOrderId} label="Pay now" className={primary} />
      )}
      {allow("cancel") && canCancel && (
        <form action={cancelOrderAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="return" value={returnTo} />
          <ConfirmButton
            message={
              paid
                ? "Cancel this order? It is already paid, so the café will arrange a refund manually."
                : "Cancel this order?"
            }
            pendingLabel="Cancelling…"
            className={`${secondary} disabled:opacity-60`}
          >
            Cancel Order
          </ConfirmButton>
        </form>
      )}
      {allow("confirm") && canConfirm && (
        <form action={confirmReceivedAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="return" value={returnTo} />
          <SubmitButton pendingLabel="Confirming…" className={primary}>
            Confirm Received
          </SubmitButton>
        </form>
      )}
    </>
  );
}
