import Link from "next/link";
import { formatDate, formatDateTime, formatPrice, formatTime } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";
import { canIssueReceipt } from "@/lib/receipt";
import { OrderActions } from "./order-actions";
import { OrderProgress, PaymentStatusBadge } from "./order-status";
import { secondaryButtonClass } from "./form-kit";

export type OrderView = {
  id: string;
  midtransOrderId: string;
  orderDate: Date;
  pickupTime: Date;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  paidAt?: Date | null;
  preparingAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  items: { id: string; productName: string; quantity: number; price: number }[];
};

const dt = "text-xs uppercase tracking-[0.1em] text-mocha";

/** Shared by the order-history modal and the /orders/[id] page. */
export function OrderDetails({ order, returnTo }: { order: OrderView; returnTo: string }) {
  return (
    <div className="grid gap-5">
      {order.orderStatus === "CANCELLED" ? (
        <p className="rounded-lg bg-status-cancelled-soft px-3 py-2 text-sm font-medium text-status-cancelled-ink">
          Cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ""}.
        </p>
      ) : (
        <OrderProgress
          status={order.orderStatus}
          times={{
            PENDING: order.orderDate,
            PREPARING: order.preparingAt,
            READY: order.readyAt,
            COMPLETED: order.completedAt,
          }}
        />
      )}

      {order.paymentStatus === "REFUND_DUE" && (
        <p className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-900">
          This order was cancelled after payment. A refund will be arranged by the café.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-labelledby="od-products">
          <h3 id="od-products" className="font-display text-base font-semibold text-espresso">
            Products
          </h3>
          <ul className="mt-2 divide-y divide-latte rounded-xl border border-latte text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                <span className="text-espresso">
                  {i.productName}
                  <span className="block text-xs text-mocha">
                    {i.quantity} × {formatPrice(i.price)}
                  </span>
                </span>
                <span className="tabular-nums text-espresso">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="od-info">
          <h3 id="od-info" className="font-display text-base font-semibold text-espresso">
            Details
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className={dt}>Date</dt>
              <dd className="text-espresso">{formatDate(order.orderDate)}</dd>
            </div>
            <div>
              <dt className={dt}>Time</dt>
              <dd className="text-espresso">{formatTime(order.orderDate)}</dd>
            </div>
            <div className="col-span-2">
              <dt className={dt}>Pickup time</dt>
              <dd className="font-medium text-espresso">{formatDateTime(order.pickupTime)}</dd>
            </div>
            <div>
              <dt className={dt}>Payment method</dt>
              <dd className="capitalize text-espresso">{order.paymentMethod ?? "Midtrans"}</dd>
            </div>
            <div>
              <dt className={dt}>Payment status</dt>
              <dd className="mt-0.5">
                <PaymentStatusBadge status={order.paymentStatus} />
              </dd>
            </div>
            <div className="col-span-2 rounded-xl bg-foam px-3.5 py-3">
              <dt className={dt}>Total price (IDR)</dt>
              <dd className="font-display text-xl font-semibold tabular-nums text-espresso">
                {formatPrice(order.totalAmount)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-latte pt-4">
        <OrderActions order={order} returnTo={returnTo} />
        {canIssueReceipt(order.paymentStatus) && (
          <Link href={`/orders/${order.id}/receipt`} className={secondaryButtonClass}>
            View receipt
          </Link>
        )}
      </div>
    </div>
  );
}
