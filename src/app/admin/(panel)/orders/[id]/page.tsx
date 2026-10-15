import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrder } from "@/lib/admin-orders";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { Notice } from "@/components/form-kit";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

/** Deep-link / no-JS version of the order drawer on /admin/orders. */
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
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="grid max-w-2xl gap-5">
      <Link href="/admin/orders" className="text-sm font-medium text-mocha hover:text-espresso">
        ← Order Management
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
        Order <span className="font-mono text-2xl">{order.midtransOrderId}</span>
      </h1>
      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      <div className="rounded-2xl border border-latte bg-white p-5">
        <AdminOrderDetail order={order} returnTo={`/admin/orders/${order.id}`} />
      </div>
    </div>
  );
}
