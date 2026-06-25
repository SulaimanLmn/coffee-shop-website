import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import {
  asOrderStatus,
  nextStatus,
  statusLabel,
} from "@/lib/catalog";
import { StatusBadge, OrderTimeline } from "@/components/order-status";
import { CancelOrderButton } from "@/components/admin/cancel-order-button";
import { advanceOrderStatusAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(-6).toUpperCase()}` };
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const admin = await isAdmin();
  if (!admin) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  const status = asOrderStatus(order.status);
  const advance = nextStatus(status);
  const canCancel = status !== "CANCELLED" && status !== "DELIVERED";

  const milestones: { label: string; at: Date | null }[] = [
    { label: "Paid", at: order.paidAt },
    { label: "Roasting", at: order.roastedAt },
    { label: "Shipped", at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/admin" className="hover:text-espresso">
          Admin
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-espresso">
          Order {order.id.slice(-6).toUpperCase()}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
            Order details
          </h1>
          <p className="mt-1 text-sm text-mocha">
            Placed {formatDate(order.createdAt)} · {order.customerEmail}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Fulfillment controls */}
      <div className="mt-6 rounded-2xl border border-latte bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
              Fulfilment
            </p>
            <p className="mt-1 text-sm text-espresso">
              Current status: {statusLabel(status)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {advance && (
              <form action={advanceOrderStatusAction}>
                <input type="hidden" name="id" value={order.id} />
                <button
                  type="submit"
                  className="rounded-full bg-caramel px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
                >
                  Mark as {statusLabel(advance)}
                </button>
              </form>
            )}
            {canCancel && <CancelOrderButton id={order.id} />}
          </div>
        </div>
        <div className="mt-5">
          <OrderTimeline status={status} />
        </div>
      </div>

      {/* Milestone timestamps */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-latte bg-latte sm:grid-cols-4">
        {milestones.map((m) => (
          <div key={m.label} className="bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.1em] text-mocha">
              {m.label}
            </p>
            <p className="mt-1 text-sm font-medium text-espresso">
              {formatDate(m.at)}
            </p>
          </div>
        ))}
      </div>

      {/* Items */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Items
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-latte border-y border-latte">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-foam">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-espresso">
                    {item.product.name}
                  </p>
                  <p className="mt-0.5 text-sm text-mocha">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-display font-semibold tabular-nums text-espresso">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-latte pt-4">
          <span className="font-display text-base font-semibold text-espresso">
            Order total
          </span>
          <span className="font-display text-xl font-semibold tabular-nums text-espresso">
            {formatPrice(order.amount)}
          </span>
        </div>
      </section>

      {/* Shipping */}
      {order.shipLine1 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-espresso">
            Shipping address
          </h2>
          <div className="mt-3 rounded-2xl border border-latte bg-white p-5 text-sm text-espresso">
            <p className="font-medium">{order.shipName}</p>
            <p className="mt-1 text-mocha">{order.shipLine1}</p>
            <p className="text-mocha">
              {order.shipCity}
              {order.shipCity && order.shipPostalCode ? ", " : ""}
              {order.shipPostalCode}
            </p>
            <p className="text-mocha">{order.shipCountry}</p>
          </div>
        </section>
      )}

      <Link
        href="/admin"
        className="mt-8 inline-flex items-center justify-center rounded-full border border-latte bg-white px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:border-caramel"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
