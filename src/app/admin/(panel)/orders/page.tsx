import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  adminNextStatuses,
  isOrderStatus,
  orderStatusLabel,
} from "@/lib/orders";
import { adminUpdateOrderStatusAction } from "@/lib/actions/orders";
import { OrderStatusBadge } from "@/components/order-status";
import { Notice, primaryButtonClass } from "@/components/form-kit";

export const metadata: Metadata = { title: "Order management" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status && isOrderStatus(sp.status) ? sp.status : null;
  const q = (sp.q ?? "").trim().slice(0, 60);

  // Unpaid/failed attempts never reach the queue; refund-due orders stay visible.
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ["PAID", "REFUND_DUE"] },
      ...(status ? { orderStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { midtransOrderId: { contains: q, mode: "insensitive" } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { orderDate: "desc" },
    include: { items: true, user: { select: { fullName: true, email: true } } },
    take: 100,
  });

  const returnTo = `/admin/orders${status || q ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) })}` : ""}`;

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
        Order management
      </h1>
      {sp.notice && <Notice kind="success">Order status updated.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <form method="get" className="flex flex-wrap items-end gap-3">
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
          Order ID or customer
          <input
            name="q"
            defaultValue={q}
            maxLength={60}
            className="w-56 rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
          />
        </label>
        <button type="submit" className={primaryButtonClass}>
          Filter
        </button>
        {(status || q) && (
          <Link href="/admin/orders" className="py-2 text-sm font-medium text-mocha hover:text-espresso">
            Clear
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          No orders found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-latte bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte align-top">
              {orders.map((o) => {
                const next = adminNextStatuses(o.orderStatus);
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-mocha">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-caramel-dark hover:text-espresso">
                        {formatDateTime(o.orderDate)}
                      </Link>
                      <div className="font-mono text-xs">{o.midtransOrderId}</div>
                      <div className="text-xs">Pickup {formatDateTime(o.pickupTime)}</div>
                    </td>
                    <td className="px-4 py-3 text-espresso">{o.user.fullName}</td>
                    <td className="px-4 py-3 text-espresso">
                      {o.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {next.length > 0 ? (
                        <form action={adminUpdateOrderStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="return" value={returnTo} />
                          <select
                            name="status"
                            defaultValue={o.orderStatus}
                            aria-label={`Status for ${o.midtransOrderId}`}
                            className="rounded-lg border border-latte bg-white px-2 py-1.5 text-sm text-espresso"
                          >
                            <option value={o.orderStatus}>{orderStatusLabel(o.orderStatus)}</option>
                            {next.map((s) => (
                              <option key={s} value={s}>
                                {orderStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-full bg-caramel-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-coffee"
                          >
                            Update
                          </button>
                        </form>
                      ) : (
                        <OrderStatusBadge status={o.orderStatus} />
                      )}
                      {o.paymentStatus === "REFUND_DUE" && (
                        <p className="mt-1 text-xs font-medium text-purple-800">Refund due</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
