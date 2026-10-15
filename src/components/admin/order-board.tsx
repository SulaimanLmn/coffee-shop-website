import Link from "next/link";
import { formatPrice, formatTime } from "@/lib/format";
import {
  BOARD_STATUSES,
  adminOrdersHref,
  boardColumns,
  orderStatusLabel,
  type BoardStatus,
} from "@/lib/orders";
import { pickupUrgency, urgencyLabel } from "@/lib/pickup";
import type { AdminOrder } from "@/lib/admin-orders";
import { orderBarStyles } from "@/components/order-status";
import { OrderActionForm } from "./order-action";

const EMPTY: Record<BoardStatus, string> = {
  PENDING: "No orders waiting. You're all caught up.",
  PREPARING: "Nothing in the kitchen right now.",
  READY: "No orders waiting for pickup.",
};

function matches(order: AdminOrder, q: string) {
  const needle = q.toLowerCase();
  return (
    order.midtransOrderId.toLowerCase().includes(needle) ||
    order.user.fullName.toLowerCase().includes(needle)
  );
}

/** Live board: Pending / Preparing / Ready, soonest pickup first. */
export function OrderBoard({
  orders,
  q,
  now,
}: {
  orders: AdminOrder[];
  q: string;
  now: Date;
}) {
  const columns = boardColumns(orders);

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
      {BOARD_STATUSES.map((status) => {
        const list = columns[status];
        const headingId = `board-${status}`;
        return (
          <section
            key={status}
            aria-labelledby={headingId}
            className="overflow-hidden rounded-2xl border border-latte bg-foam/60 p-3 pt-0"
          >
            <div aria-hidden="true" className={`-mx-3 mb-2 h-1 ${orderBarStyles[status]}`} />
            <h2
              id={headingId}
              className="flex items-center justify-between px-1 pb-3 pt-1 font-display text-lg font-semibold text-espresso"
            >
              {orderStatusLabel(status)}
              <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-semibold tabular-nums text-mocha">
                {list.length}
                <span className="sr-only"> orders</span>
              </span>
            </h2>
            {list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-latte bg-white/70 px-4 py-8 text-center text-sm text-mocha">
                {EMPTY[status]}
              </p>
            ) : (
              <ol className="grid gap-3">
                {list.map((order) => (
                  <BoardCard key={order.id} order={order} now={now} highlight={!!q && matches(order, q)} q={q} />
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({
  order,
  now,
  highlight,
  q,
}: {
  order: AdminOrder;
  now: Date;
  highlight: boolean;
  q: string;
}) {
  const urgency = pickupUrgency(order.pickupTime, now);
  const urgencyClass =
    urgency.kind === "overdue"
      ? "font-semibold text-status-cancelled-ink"
      : urgency.kind === "soon"
        ? "font-semibold text-status-pending-ink"
        : "text-mocha";

  return (
    <li
      id={`order-${order.id}`}
      className={
        "relative scroll-mt-24 overflow-hidden rounded-xl border border-latte bg-white p-3.5 pl-5 shadow-sm" +
        (highlight ? " ring-2 ring-caramel-dark" : "")
      }
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${orderBarStyles[order.orderStatus]}`}
      />
      <div className="flex items-start justify-between gap-2">
        <Link
          id={`order-link-${order.id}`}
          href={adminOrdersHref({ q, order: order.id })}
          className="font-mono text-sm font-semibold text-caramel-dark underline-offset-2 hover:underline"
        >
          {order.midtransOrderId}
          <span className="sr-only">: view details</span>
        </Link>
        <span className={`shrink-0 text-xs ${urgencyClass}`}>{urgencyLabel(urgency)}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-espresso">{order.user.fullName}</p>
      <p className="text-xs text-mocha">
        Pickup {formatTime(order.pickupTime)}
        {highlight && <span className="sr-only"> (matches your search)</span>}
      </p>

      <ul className="mt-2.5 grid gap-0.5 text-sm text-espresso">
        {order.items.map((i) => (
          <li key={i.id}>
            <span className="tabular-nums">{i.quantity}×</span> {i.productName}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-latte pt-3">
        <span className="text-sm font-semibold tabular-nums text-espresso">
          {formatPrice(order.totalAmount)}
        </span>
        <OrderActionForm
          orderId={order.id}
          orderStatus={order.orderStatus}
          returnTo={`${adminOrdersHref({ q })}#order-${order.id}`}
        />
      </div>
    </li>
  );
}
