import Link from "next/link";
import { formatDateTime, formatPrice } from "@/lib/format";
import { canIssueReceipt } from "@/lib/receipt";
import { OrderProgress, OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status";
import { secondaryButtonClass } from "@/components/form-kit";
import type { AdminOrder } from "@/lib/admin-orders";
import { OrderActionForm } from "./order-action";

const dt = "text-xs uppercase tracking-[0.1em] text-mocha";

/** Customer, items, payment, status and the next action. Used by the drawer and /admin/orders/[id]. */
export function AdminOrderDetail({ order, returnTo }: { order: AdminOrder; returnTo: string }) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.orderStatus} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {order.orderStatus === "CANCELLED" ? (
        <p className="text-sm text-mocha">
          Cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ""}.
        </p>
      ) : (
        <OrderProgress status={order.orderStatus} />
      )}

      {order.paymentStatus === "REFUND_DUE" && (
        <p className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-900">
          The customer cancelled after paying. Refund {formatPrice(order.totalAmount)} manually.
        </p>
      )}

      <section aria-labelledby="od-customer">
        <h3 id="od-customer" className="font-display text-base font-semibold text-espresso">
          Customer
        </h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={dt}>Name</dt>
            <dd className="text-espresso">{order.user.fullName}</dd>
          </div>
          <div>
            <dt className={dt}>Phone</dt>
            <dd className="text-espresso">{order.user.phone ?? "-"}</dd>
          </div>
          <div className="col-span-2">
            <dt className={dt}>Email</dt>
            <dd className="break-all text-espresso">{order.user.email}</dd>
          </div>
          <div className="col-span-2">
            <dt className={dt}>Pickup time</dt>
            <dd className="font-medium text-espresso">{formatDateTime(order.pickupTime)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="od-items">
        <h3 id="od-items" className="font-display text-base font-semibold text-espresso">
          Items
        </h3>
        <ul className="mt-2 divide-y divide-latte rounded-xl border border-latte text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 px-4 py-2.5">
              <span>
                {i.productName} <span className="text-mocha">× {i.quantity}</span>
              </span>
              <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between bg-foam px-4 py-2.5 font-display text-base font-semibold text-espresso">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="od-payment">
        <h3 id="od-payment" className="font-display text-base font-semibold text-espresso">
          Payment
        </h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={dt}>Method</dt>
            <dd className="capitalize text-espresso">{order.paymentMethod ?? "Midtrans"}</dd>
          </div>
          <div>
            <dt className={dt}>Paid at</dt>
            <dd className="text-espresso">{order.paidAt ? formatDateTime(order.paidAt) : "-"}</dd>
          </div>
          <div>
            <dt className={dt}>Ordered</dt>
            <dd className="text-espresso">{formatDateTime(order.orderDate)}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-latte pt-4">
        <OrderActionForm orderId={order.id} orderStatus={order.orderStatus} returnTo={returnTo} />
        {canIssueReceipt(order.paymentStatus) && (
          <Link href={`/orders/${order.id}/receipt`} className={secondaryButtonClass}>
            View receipt
          </Link>
        )}
      </div>
    </div>
  );
}
