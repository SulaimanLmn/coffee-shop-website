import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ADMIN_HISTORY_PAGE_SIZE,
  ORDER_STATUSES,
  adminOrdersHref,
  orderStatusLabel,
  parseAdminOrdersView,
  type AdminOrdersView,
} from "@/lib/orders";
import {
  countRefundsDue,
  getAdminOrder,
  getBoardOrders,
  getHistory,
  type AdminOrder,
} from "@/lib/admin-orders";
import { AutoRefresh } from "@/components/auto-refresh";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { OrderBoard } from "@/components/admin/order-board";
import { Notice, inputClass, primaryButtonClass } from "@/components/form-kit";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status";
import { PageHeader } from "@/components/page-header";
import { RouteDialog } from "@/components/route-dialog";

export const metadata: Metadata = { title: "Order management" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const view = parseAdminOrdersView(sp);
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const now = new Date();

  const isBoard = view.view === "board";
  const [boardOrders, history, refunds, selected] = await Promise.all([
    isBoard ? getBoardOrders() : Promise.resolve([]),
    isBoard ? null : getHistory(view),
    countRefundsDue(),
    view.order ? getAdminOrder(view.order) : Promise.resolve(null),
  ]);
  const pendingCount = boardOrders.filter((o) => o.orderStatus === "PENDING").length;

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Order Management"
        description="Paid pickup orders. Start preparing, then mark ready; the customer confirms collection."
        actions={isBoard ? <AutoRefresh seconds={20} watchCount={pendingCount} /> : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Order views" className="flex gap-1 rounded-full bg-foam p-1">
          <ViewTab href={adminOrdersHref({})} current={isBoard}>
            Live board
          </ViewTab>
          <ViewTab href={adminOrdersHref({ view: "history" })} current={!isBoard}>
            History
          </ViewTab>
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          {refunds > 0 && (
            <Link
              href={adminOrdersHref({ view: "history", status: "CANCELLED" })}
              className="text-sm font-medium text-purple-900 underline-offset-2 hover:underline"
            >
              {refunds} refund{refunds === 1 ? "" : "s"} due
            </Link>
          )}
          <SearchForm view={view} />
        </div>
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      {isBoard ? (
        <OrderBoard orders={boardOrders} q={view.q} now={now} />
      ) : (
        history && <History view={view} history={history} />
      )}

      {view.order && (
        <RouteDialog
          key={view.order}
          variant="side"
          title={
            selected ? (
              <span className="font-mono text-lg">{selected.midtransOrderId}</span>
            ) : (
              "Order not found"
            )
          }
          closeHref={adminOrdersHref({ ...view, order: null })}
          returnFocusId={`order-link-${view.order}`}
        >
          {selected ? (
            <AdminOrderDetail order={selected} returnTo={adminOrdersHref(view)} />
          ) : (
            <p className="text-sm text-mocha">
              This order does not exist or has not been paid, so it is not in the queue.
            </p>
          )}
        </RouteDialog>
      )}
    </div>
  );
}

function ViewTab({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
        (current ? "bg-white text-espresso shadow-sm" : "text-mocha hover:text-espresso")
      }
    >
      {children}
    </Link>
  );
}

function SearchForm({ view }: { view: AdminOrdersView }) {
  const isBoard = view.view === "board";
  return (
    <form method="get" action="/admin/orders" role="search" className="flex items-center gap-2">
      {!isBoard && <input type="hidden" name="view" value="history" />}
      {!isBoard && view.status && <input type="hidden" name="status" value={view.status} />}
      <label className="sr-only" htmlFor="order-search">
        {isBoard ? "Highlight orders by ID or customer" : "Search orders by ID or customer"}
      </label>
      <input
        id="order-search"
        name="q"
        type="search"
        defaultValue={view.q}
        maxLength={60}
        placeholder="Order ID or customer"
        className={`${inputClass} w-52`}
      />
      <button type="submit" className={primaryButtonClass}>
        {isBoard ? "Find" : "Search"}
      </button>
      {view.q && (
        <Link
          href={adminOrdersHref({ view: view.view, status: view.status })}
          className="text-sm font-medium text-mocha hover:text-espresso"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

function History({
  view,
  history,
}: {
  view: AdminOrdersView;
  history: Awaited<ReturnType<typeof getHistory>>;
}) {
  const { orders, total, page, pages, counts, all } = history;
  const chip = (active: boolean) =>
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
    (active
      ? "border-espresso bg-espresso text-cream"
      : "border-latte bg-white text-espresso hover:border-caramel");

  return (
    <div className="grid gap-4">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Link
          href={adminOrdersHref({ view: "history", q: view.q })}
          aria-current={view.status === null ? "page" : undefined}
          className={chip(view.status === null)}
        >
          All <span className="tabular-nums opacity-80">{all}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={adminOrdersHref({ view: "history", status: s, q: view.q })}
            aria-current={view.status === s ? "page" : undefined}
            className={chip(view.status === s)}
          >
            {orderStatusLabel(s)} <span className="tabular-nums opacity-80">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          <p>No orders match.</p>
          {(view.status || view.q) && (
            <Link href={adminOrdersHref({ view: "history" })} className="mt-2 inline-block text-sm font-medium text-caramel-dark">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-latte bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">
              Recent orders, newest first. Page {page} of {pages}.
            </caption>
            <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Items</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte align-top">
              {orders.map((o) => (
                <HistoryRow key={o.id} order={o} view={view} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-mocha">
        <p>
          {total === 0
            ? "0 orders"
            : `Showing ${(page - 1) * ADMIN_HISTORY_PAGE_SIZE + 1}–${Math.min(page * ADMIN_HISTORY_PAGE_SIZE, total)} of ${total}`}
        </p>
        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={adminOrdersHref({ ...view, order: null, page: page - 1 })}
                rel="prev"
                className="rounded-full border border-latte bg-white px-4 py-1.5 font-medium text-espresso hover:border-caramel"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-full border border-latte px-4 py-1.5 opacity-50">Previous</span>
            )}
            <span className="tabular-nums" aria-current="page">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link
                href={adminOrdersHref({ ...view, order: null, page: page + 1 })}
                rel="next"
                className="rounded-full border border-latte bg-white px-4 py-1.5 font-medium text-espresso hover:border-caramel"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-full border border-latte px-4 py-1.5 opacity-50">Next</span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ order: o, view }: { order: AdminOrder; view: AdminOrdersView }) {
  return (
    <tr id={`order-${o.id}`} className="scroll-mt-24 hover:bg-foam/50">
      <td className="px-4 py-2.5 text-mocha">
        <Link
          id={`order-link-${o.id}`}
          href={adminOrdersHref({ ...view, order: o.id })}
          className="font-medium text-caramel-dark underline-offset-2 hover:underline"
        >
          {formatDateTime(o.orderDate)}
          <span className="sr-only">: view order {o.midtransOrderId}</span>
        </Link>
        <div className="font-mono text-xs">{o.midtransOrderId}</div>
      </td>
      <td className="px-4 py-2.5 text-espresso">{o.user.fullName}</td>
      <td className="max-w-xs px-4 py-2.5 text-espresso">
        {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
      </td>
      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-espresso">
        {formatPrice(o.totalAmount)}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={o.orderStatus} />
          {o.paymentStatus === "REFUND_DUE" && <PaymentStatusBadge status={o.paymentStatus} />}
        </div>
      </td>
    </tr>
  );
}
