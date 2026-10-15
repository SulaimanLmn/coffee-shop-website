import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/orders";
import { buildReceipt, canIssueReceipt } from "@/lib/receipt";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { fullName: true, email: true } } },
  });
  // Only the owner or an admin may view; unpaid orders have no receipt.
  if (!order || (user.role !== "ADMIN" && order.userId !== user.id)) notFound();
  if (!canIssueReceipt(order.paymentStatus)) notFound();

  const r = buildReceipt(order);

  return (
    <div className="receipt-page mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="print:hidden mb-4 flex items-center justify-between">
        <a
          href={user.role === "ADMIN" ? `/admin/orders/${order.id}` : `/orders/${order.id}`}
          className="text-sm font-medium text-mocha hover:text-espresso"
        >
          ← Back to order
        </a>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-latte bg-white p-8 print:border-0 print:p-0">
        <header className="border-b border-dashed border-latte pb-5 text-center">
          <p className="font-display text-2xl font-semibold text-espresso">Brew Haven</p>
          <p className="text-xs uppercase tracking-[0.14em] text-mocha">Payment receipt</p>
          {r.refundDue && (
            <p className="mt-3 inline-block rounded border border-purple-300 px-2 py-0.5 text-xs font-semibold uppercase text-purple-800">
              Order cancelled - refund due
            </p>
          )}
        </header>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Receipt no.</dt>
            <dd className="font-mono text-espresso">{r.number}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Date</dt>
            <dd className="text-espresso">{formatDateTime(r.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Customer</dt>
            <dd className="text-espresso">
              {r.customerName}
              <br />
              <span className="text-mocha">{r.customerEmail}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Pickup time</dt>
            <dd className="text-espresso">{formatDateTime(r.pickupTime)}</dd>
          </div>
        </dl>

        <table className="mt-6 w-full text-sm">
          <thead className="border-b border-latte text-left text-xs uppercase tracking-[0.08em] text-mocha">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-latte">
            {r.lines.map((l, i) => (
              <tr key={i}>
                <td className="py-2 text-espresso">{l.name}</td>
                <td className="py-2 text-right tabular-nums">{l.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatPrice(l.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{formatPrice(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-latte pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-mocha">Subtotal</span>
            <span className="tabular-nums">{formatPrice(r.subtotal)}</span>
          </div>
          <div className="flex justify-between font-display text-lg font-semibold text-espresso">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(r.total)}</span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-dashed border-latte pt-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Payment method</dt>
            <dd className="capitalize text-espresso">{r.paymentMethod}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Payment</dt>
            <dd className="text-espresso">{paymentStatusLabel(r.paymentStatus)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Order</dt>
            <dd className="text-espresso">{orderStatusLabel(r.orderStatus)}</dd>
          </div>
        </dl>

        <p className="mt-6 text-center text-xs text-mocha">
          Thank you for ordering with Brew Haven. Please show this receipt at the counter when collecting your order.
        </p>
      </article>

      <style>{`@media print { header, footer, nav { display: none !important; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
