import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { syncOrderPayment } from "@/lib/order-service";
import { OrderDetails } from "@/components/order-details";
import { Notice } from "@/components/form-kit";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/orders/${id}`);

  const existing = await prisma.order.findFirst({ where: { id, userId: user.id } });
  if (!existing) notFound();
  await syncOrderPayment(existing);

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Link href="/orders" className="text-sm font-medium text-mocha hover:text-espresso">
        ← Order history
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-espresso">
        Order details
      </h1>
      <div className="mt-4 grid gap-2">
        {sp.notice && <Notice kind="success">Order updated.</Notice>}
        {sp.error && <Notice kind="error">{sp.error}</Notice>}
      </div>
      <div className="mt-6 rounded-2xl border border-latte bg-white p-6">
        <OrderDetails order={order} returnTo={`/orders/${order.id}`} />
      </div>
    </div>
  );
}
