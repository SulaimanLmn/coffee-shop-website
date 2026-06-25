import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { categoryLabel, statusLabel, asOrderStatus } from "@/lib/catalog";
import { StatusBadge, OrderTimeline } from "@/components/order-status";

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.customerId !== customer.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/account" className="hover:text-espresso">
          Account
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
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={asOrderStatus(order.status)} />
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-2xl border border-latte bg-white p-5">
        <OrderTimeline status={asOrderStatus(order.status)} />
      </div>

      {/* Items */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-espresso">
          Items
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-latte border-y border-latte">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-foam">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-espresso">{item.product.name}</p>
                  <p className="mt-0.5 text-xs text-mocha">
                    {categoryLabel(item.product.category)}
                  </p>
                  <p className="mt-1 text-sm text-mocha">
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
            Total
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
            Shipping to
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

      <div className="mt-6 flex items-center gap-3 text-sm">
        <span className="text-mocha">Status:</span>
        <span className="font-medium text-espresso">
          {statusLabel(asOrderStatus(order.status))}
        </span>
      </div>

      <Link
        href="/account"
        className="mt-8 inline-flex items-center justify-center rounded-full border border-latte bg-white px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:border-caramel"
      >
        ← Back to orders
      </Link>
    </div>
  );
}
