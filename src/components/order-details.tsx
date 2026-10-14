import Link from "next/link";
import { formatDate, formatPrice, formatTime, formatDateTime } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";
import { canIssueReceipt } from "@/lib/receipt";
import { cancelOrderAction, confirmReceivedAction } from "@/lib/actions/orders";
import { OrderProgress, OrderStatusBadge, PaymentStatusBadge } from "./order-status";
import { PayButton } from "./snap-pay";
import { primaryButtonClass, secondaryButtonClass } from "./form-kit";

export type OrderView = {
  id: string;
  midtransOrderId: string;
  orderDate: Date;
  pickupTime: Date;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  items: { id: string; productName: string; quantity: number; price: number }[];
};

/** Shared by the order-history modal and the /orders/[id] page. */
export function OrderDetails({
  order,
  returnTo,
}: {
  order: OrderView;
  returnTo: string;
}) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const canCancel = order.orderStatus === "PENDING";
  const canConfirm = order.orderStatus === "READY" && order.paymentStatus === "PAID";
  const canPay = order.paymentStatus === "UNPAID" && order.orderStatus === "PENDING";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-espresso">{order.midtransOrderId}</span>
        <OrderStatusBadge status={order.orderStatus} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <OrderProgress status={order.orderStatus} />

      <ul className="divide-y divide-latte rounded-xl border border-latte">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-espresso">
              {i.productName} <span className="text-mocha">× {i.quantity}</span>
            </span>
            <span className="tabular-nums text-espresso">{formatPrice(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Date</dt>
          <dd className="text-espresso">{formatDate(order.orderDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Time</dt>
          <dd className="text-espresso">{formatTime(order.orderDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Pickup time</dt>
          <dd className="text-espresso">{formatDateTime(order.pickupTime)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Payment method</dt>
          <dd className="capitalize text-espresso">{order.paymentMethod ?? "Midtrans"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Subtotal</dt>
          <dd className="tabular-nums text-espresso">{formatPrice(subtotal)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Total (IDR)</dt>
          <dd className="font-display text-lg font-semibold tabular-nums text-espresso">
            {formatPrice(order.totalAmount)}
          </dd>
        </div>
      </dl>

      {order.paymentStatus === "REFUND_DUE" && (
        <p className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-900">
          This order was cancelled after payment. A refund will be arranged by the café.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canPay && (
          <PayButton orderId={order.midtransOrderId} label="Pay now" className={primaryButtonClass} />
        )}
        {canCancel && (
          <form action={cancelOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="return" value={returnTo} />
            <button type="submit" className={secondaryButtonClass}>
              Cancel Order
            </button>
          </form>
        )}
        {canConfirm && (
          <form action={confirmReceivedAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="return" value={returnTo} />
            <button type="submit" className={primaryButtonClass}>
              Confirm Received
            </button>
          </form>
        )}
        {canIssueReceipt(order.paymentStatus) && (
          <Link href={`/orders/${order.id}/receipt`} className={secondaryButtonClass}>
            View receipt
          </Link>
        )}
      </div>
    </div>
  );
}
