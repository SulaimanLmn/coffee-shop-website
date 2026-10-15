import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { SalesChart, TopProductsChart } from "@/components/admin-charts";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

const TZ = "Asia/Jakarta";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const dayLabel = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short" }).format(d);

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export default async function AdminDashboard() {
  await requireAdmin();
  const since = daysAgo(14);
  // Only paid orders count towards the numbers (refund-due orders are cancelled).
  const paid = { paymentStatus: "PAID" } as const;

  const [totalOrders, sales, pending, completed, totalProducts, totalCategories, recent, top] =
    await Promise.all([
      prisma.order.count({ where: paid }),
      prisma.order.aggregate({
        where: { ...paid, orderStatus: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { ...paid, orderStatus: "PENDING" } }),
      prisma.order.count({ where: { ...paid, orderStatus: "COMPLETED" } }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.findMany({
        where: { ...paid, orderStatus: { not: "CANCELLED" }, orderDate: { gte: since } },
        select: { orderDate: true, totalAmount: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { ...paid, orderStatus: { not: "CANCELLED" } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  // Last 14 days (including today), bucketed by Jakarta calendar day.
  const days = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i));
  const totals = new Map<string, number>();
  for (const o of recent) {
    const k = dayKey(o.orderDate);
    totals.set(k, (totals.get(k) ?? 0) + o.totalAmount);
  }
  const salesSeries = days.map((d) => ({ label: dayLabel(d), amount: totals.get(dayKey(d)) ?? 0 }));

  const stats = [
    { label: "Total Orders", value: totalOrders.toLocaleString("en-US") },
    { label: "Total Sales", value: formatPrice(sales._sum.totalAmount ?? 0) },
    { label: "Pending Orders", value: pending.toLocaleString("en-US") },
    { label: "Completed Orders", value: completed.toLocaleString("en-US") },
    { label: "Total Products", value: totalProducts.toLocaleString("en-US") },
    { label: "Total Categories", value: totalCategories.toLocaleString("en-US") },
  ];

  return (
    <div className="grid gap-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">Dashboard</h1>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-latte bg-white p-5">
            <dt className="text-xs uppercase tracking-[0.1em] text-mocha">{s.label}</dt>
            <dd className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-latte bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-espresso">Sales, last 14 days</h2>
        <div className="mt-3">
          <SalesChart data={salesSeries} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-latte bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-espresso">Top sellers</h2>
          <div className="mt-4">
            <TopProductsChart
              data={top.map((t) => ({ name: t.productName, units: t._sum.quantity ?? 0 }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
