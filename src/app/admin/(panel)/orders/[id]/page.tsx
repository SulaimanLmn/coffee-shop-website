import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/format";
import { adminNextStatuses, orderStatusLabel } from "@/lib/orders";
import { canIssueReceipt } from "@/lib/receipt";
import { adminUpdateOrderStatusAction } from "@/lib/actions/orders";
import { OrderProgress, OrderStatusBadge, PaymentStatusBadge } from "@/components/order-status";
import { Notice, primaryButtonClass, secondaryButtonClass } from "@/components/form-kit";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { fullName: true, email: true, phone: true } } },
  });
  if (!order || !["PAID", "REFUND_DUE"].includes(order.paymentStatus)) notFound();

  const next = adminNextStatuses(order.orderStatus);

  return (
    <div className="grid max-w-2xl gap-6">
      <Link href="/admin/orders" className="text-sm font-medium text-mocha hover:text-espresso">
        ← Orders
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
        Order <span className="font-mono text-2xl">{order.midtransOrderId}</span>
      </h1>
      {sp.notice && <Notice kind="success">Order status updated.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.orderStatus} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>
      <OrderProgress status={order.orderStatus} />

      <section className="rounded-2xl border border-latte bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-espresso">Customer</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Name</dt>
            <dd className="text-espresso">{order.user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Email</dt>
            <dd className="text-espresso">{order.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Phone</dt>
            <dd className="text-espresso">{order.user.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Pickup time</dt>
            <dd className="text-espresso">{formatDateTime(order.pickupTime)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-latte bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-espresso">Items</h2>
        <ul className="mt-3 divide-y divide-latte text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2">
              <span>
                {i.productName} <span className="text-mocha">× {i.quantity}</span>
              </span>
              <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-latte pt-3 font-display text-lg font-semibold text-espresso">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-latte bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-espresso">Payment</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Method</dt>
            <dd className="capitalize text-espresso">{order.paymentMethod ?? "Midtrans"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Paid at</dt>
            <dd className="text-espresso">{order.paidAt ? formatDateTime(order.paidAt) : "-"}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {next.map((s) => (
          <form key={s} action={adminUpdateOrderStatusAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={s} />
            <input type="hidden" name="return" value={`/admin/orders/${order.id}`} />
            <button type="submit" className={primaryButtonClass}>
              Mark as {orderStatusLabel(s)}
            </button>
          </form>
        ))}
        {canIssueReceipt(order.paymentStatus) && (
          <Link href={`/orders/${order.id}/receipt`} className={secondaryButtonClass}>
            View receipt
          </Link>
        )}
      </div>
    </div>
  );
}
