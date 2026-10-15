import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  customerOrdersHref,
  isActiveOrder,
  orderStatusLabel,
  parseCustomerOrdersView,
  type CustomerOrdersView,
} from "@/lib/orders";
import { syncOrdersPayment } from "@/lib/order-service";
import { AutoRefresh } from "@/components/auto-refresh";
import { Notice, inputClass, primaryButtonClass } from "@/components/form-kit";
import { OrderActions } from "@/components/order-actions";
import { OrderDetails } from "@/components/order-details";
import { OrderProgress, OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status";
import { PageHeader } from "@/components/page-header";
import { RouteDialog } from "@/components/route-dialog";

export const metadata: Metadata = { title: "Order history" };
export const dynamic = "force-dynamic";

type OrderRow = Awaited<ReturnType<typeof loadOrders>>[number];

function loadOrders(where: Prisma.OrderWhereInput) {
  return prisma.order.findMany({
    where,
    orderBy: { orderDate: "desc" },
    include: { items: true },
    take: 100,
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/orders");
  const sp = await searchParams;
  const view = parseCustomerOrdersView(sp);
  const error = typeof sp.error === "string" ? sp.error : undefined;

  // Settle any in-flight payments first so statuses are current without webhooks.
  const unpaid = await prisma.order.findMany({
    where: { userId: user.id, paymentStatus: "UNPAID" },
  });
  await syncOrdersPayment(unpaid);

  const [activeRaw, history, selected] = await Promise.all([
    loadOrders({ userId: user.id, orderStatus: { in: ["PENDING", "PREPARING", "READY"] } }),
    loadOrders({
      userId: user.id,
      ...(view.status ? { orderStatus: view.status } : {}),
      ...(view.q ? { midtransOrderId: { contains: view.q, mode: "insensitive" } } : {}),
    }),
    view.view
      ? prisma.order.findFirst({
          where: { id: view.view, userId: user.id },
          include: { items: true },
        })
      : Promise.resolve(null),
  ]);
  // Soonest pickup first: that is what the customer is waiting for.
  const active = activeRaw
    .filter((o) => isActiveOrder(o.orderStatus))
    .sort((a, b) => a.pickupTime.getTime() - b.pickupTime.getTime());

  const filters = { status: view.status, q: view.q };
  const listHref = customerOrdersHref(filters);
  const openFrom = view.from === "active" ? "active" : null;
  const chip = (on: boolean) =>
    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
    (on
      ? "border-espresso bg-espresso text-cream"
      : "border-latte bg-white text-espresso hover:border-caramel");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <PageHeader
        title="Order History"
        description="Your pickup orders. Active ones update by themselves."
        actions={active.length > 0 ? <AutoRefresh seconds={30} /> : undefined}
      />

      {error && <Notice kind="error">{error}</Notice>}

      {active.length > 0 && (
        <section aria-labelledby="active-orders" className="grid gap-3">
          <h2 id="active-orders" className="font-display text-xl font-semibold text-espresso">
            Active orders
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {active.map((o) => (
              <ActiveOrderCard key={o.id} order={o} filters={filters} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-orders" className="grid gap-4">
        <h2 id="all-orders" className="font-display text-xl font-semibold text-espresso">
          Order history
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
            <Link
              href={customerOrdersHref({ q: view.q })}
              aria-current={view.status === null ? "page" : undefined}
              className={chip(view.status === null)}
            >
              All
            </Link>
            {ORDER_STATUSES.map((s) => (
              <Link
                key={s}
                href={customerOrdersHref({ status: s, q: view.q })}
                aria-current={view.status === s ? "page" : undefined}
                className={chip(view.status === s)}
              >
                {orderStatusLabel(s)}
              </Link>
            ))}
          </nav>
          <form method="get" action="/orders" role="search" className="flex items-center gap-2">
            {view.status && <input type="hidden" name="status" value={view.status} />}
            <label className="sr-only" htmlFor="order-search">
              Search by Order ID
            </label>
            <input
              id="order-search"
              name="q"
              type="search"
              defaultValue={view.q}
              maxLength={40}
              placeholder="Search by Order ID"
              className={`${inputClass} w-52`}
            />
            <button type="submit" className={primaryButtonClass}>
              Search
            </button>
            {view.q && (
              <Link
                href={customerOrdersHref({ status: view.status })}
                className="text-sm font-medium text-mocha hover:text-espresso"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
            <p>
              {view.status || view.q ? "No orders match your filters." : "You have no orders yet."}
            </p>
            <Link
              href={view.status || view.q ? "/orders" : "/"}
              className="mt-2 inline-block text-sm font-medium text-caramel-dark underline-offset-2 hover:underline"
            >
              {view.status || view.q ? "Clear filters" : "Browse the menu"}
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-latte bg-white sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Your orders, newest first</caption>
                <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Items</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Payment</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-latte align-top">
                  {history.map((o) => (
                    <tr key={o.id} id={`order-${o.id}`} className="scroll-mt-24 hover:bg-foam/50">
                      <td className="px-4 py-3 font-mono text-xs text-espresso">{o.midtransOrderId}</td>
                      <td className="px-4 py-3 text-mocha">{formatDateTime(o.orderDate)}</td>
                      <td className="px-4 py-3 text-espresso">
                        {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.orderStatus} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-espresso">
                        {formatPrice(o.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Link
                            id={`view-${o.id}`}
                            href={customerOrdersHref({ ...filters, view: o.id })}
                            className="font-medium text-caramel-dark underline-offset-2 hover:underline"
                          >
                            View Details<span className="sr-only"> for {o.midtransOrderId}</span>
                          </Link>
                          <OrderActions
                            order={o}
                            only={["cancel"]}
                            compact
                            returnTo={`${listHref}#order-${o.id}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="grid gap-3 sm:hidden">
              {history.map((o) => (
                <li
                  key={o.id}
                  className="grid gap-2 rounded-2xl border border-latte bg-white p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-espresso">{o.midtransOrderId}</span>
                    <OrderStatusBadge status={o.orderStatus} />
                  </div>
                  <p className="text-mocha">{formatDateTime(o.orderDate)}</p>
                  <p className="text-espresso">
                    {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold tabular-nums text-espresso">
                      {formatPrice(o.totalAmount)}
                    </span>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-latte pt-3">
                    <Link
                      href={customerOrdersHref({ ...filters, view: o.id })}
                      className="font-medium text-caramel-dark underline-offset-2 hover:underline"
                    >
                      View Details<span className="sr-only"> for {o.midtransOrderId}</span>
                    </Link>
                    <OrderActions order={o} only={["cancel"]} compact returnTo={listHref} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {view.view && (
        <RouteDialog
          key={view.view}
          variant="center"
          title={
            selected ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg">{selected.midtransOrderId}</span>
                <OrderStatusBadge status={selected.orderStatus} />
              </span>
            ) : (
              "Order not found"
            )
          }
          closeHref={listHref}
          returnFocusId={openFrom ? `view-card-${view.view}` : `view-${view.view}`}
        >
          {selected ? (
            <OrderDetails order={selected} returnTo={customerOrdersHref(view)} />
          ) : (
            <p className="text-sm text-mocha">We could not find that order.</p>
          )}
        </RouteDialog>
      )}
    </div>
  );
}

function ActiveOrderCard({
  order: o,
  filters,
}: {
  order: OrderRow;
  filters: Pick<CustomerOrdersView, "status" | "q">;
}) {
  const unpaid = o.paymentStatus === "UNPAID";
  return (
    <li
      id={`active-${o.id}`}
      className="scroll-mt-24 grid gap-3 rounded-2xl border border-latte bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            id={`view-card-${o.id}`}
            href={customerOrdersHref({ ...filters, view: o.id, from: "active" })}
            className="font-mono text-sm font-semibold text-caramel-dark underline-offset-2 hover:underline"
          >
            {o.midtransOrderId}
            <span className="sr-only">: view details</span>
          </Link>
          <p className="mt-0.5 text-sm font-medium text-espresso">
            Pickup {formatDateTime(o.pickupTime)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={o.orderStatus} />
          {unpaid && <PaymentStatusBadge status={o.paymentStatus} />}
        </div>
      </div>

      <p className="text-sm text-mocha">
        {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
      </p>

      {unpaid ? (
        <p className="text-sm text-status-pending-ink">Waiting for payment.</p>
      ) : (
        <OrderProgress
          status={o.orderStatus}
          times={{
            PENDING: o.orderDate,
            PREPARING: o.preparingAt,
            READY: o.readyAt,
            COMPLETED: o.completedAt,
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-latte pt-3">
        <span className="font-display text-lg font-semibold tabular-nums text-espresso">
          {formatPrice(o.totalAmount)}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <OrderActions order={o} compact returnTo={`/orders#active-${o.id}`} />
        </div>
      </div>
      {o.orderStatus === "READY" && o.paymentStatus === "PAID" && (
        <p className="rounded-lg bg-status-ready-soft px-3 py-2 text-sm font-medium text-status-ready-ink">
          Your order is ready. Pick it up at the counter, then confirm below.
        </p>
      )}
    </li>
  );
}
