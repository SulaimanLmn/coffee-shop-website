import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, isOrderStatus, orderStatusLabel } from "@/lib/orders";
import { syncOrdersPayment } from "@/lib/order-service";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status";
import { OrderDetails } from "@/components/order-details";
import { Notice, primaryButtonClass } from "@/components/form-kit";

export const metadata: Metadata = { title: "Order history" };
export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  cancelled: "Order cancelled.",
  completed: "Thanks! Your order is marked as completed.",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("/orders");
  const sp = await searchParams;
  const status = sp.status && isOrderStatus(sp.status) ? sp.status : null;
  const q = (sp.q ?? "").trim().slice(0, 40);

  // Settle any in-flight payments first so statuses are current without webhooks.
  const unpaid = await prisma.order.findMany({
    where: { userId: user.id, paymentStatus: "UNPAID" },
  });
  await syncOrdersPayment(unpaid);

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(status ? { orderStatus: status } : {}),
      ...(q ? { midtransOrderId: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { orderDate: "desc" },
    include: { items: true },
    take: 100,
  });

  const selected = sp.view
    ? await prisma.order.findFirst({
        where: { id: sp.view, userId: user.id },
        include: { items: true },
      })
    : null;

  const filterQs = new URLSearchParams();
  if (status) filterQs.set("status", status);
  if (q) filterQs.set("q", q);
  const closeHref = `/orders${filterQs.size ? `?${filterQs}` : ""}`;
  const viewHref = (id: string) => {
    const p = new URLSearchParams(filterQs);
    p.set("view", id);
    return `/orders?${p}`;
  };
  const returnTo = selected ? viewHref(selected.id) : closeHref;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
        Order history
      </h1>

      <div className="mt-4 grid gap-2">
        {sp.notice && notices[sp.notice] && <Notice kind="success">{notices[sp.notice]}</Notice>}
        {sp.error && <Notice kind="error">{sp.error}</Notice>}
      </div>

      <form method="get" action="/orders" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-medium text-mocha">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-mocha">
          Order ID
          <input
            name="q"
            defaultValue={q}
            maxLength={40}
            placeholder="e.g. BH-ABC123"
            className="w-48 rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
          />
        </label>
        <button type="submit" className={primaryButtonClass}>
          Filter
        </button>
        {(status || q) && (
          <Link href="/orders" className="py-2 text-sm font-medium text-mocha hover:text-espresso">
            Clear
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          {status || q ? "No orders match your filters." : "You have no orders yet."}{" "}
          <Link href="/" className="font-medium text-caramel-dark hover:text-espresso">
            Browse the menu
          </Link>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-latte bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {orders.map((o) => (
                <tr key={o.id}>
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={viewHref(o.id)}
                      className="font-medium text-caramel-dark hover:text-espresso"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order details"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-espresso/50 p-4 sm:p-8"
        >
          <div className="w-full max-w-lg rounded-2xl border border-latte bg-cream p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-espresso">Order details</h2>
              <Link href={closeHref} className="text-sm font-medium text-mocha hover:text-espresso">
                Close
              </Link>
            </div>
            <OrderDetails order={selected} returnTo={returnTo} />
          </div>
        </div>
      )}
    </div>
  );
}
