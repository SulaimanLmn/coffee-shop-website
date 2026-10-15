import { prisma } from "@/lib/prisma";
import { buildSalesSeries, jakartaDayStart } from "@/lib/stats";

/** Paid orders nobody has started yet. Drives the sidebar badge and the dashboard. */
export function countOrdersNeedingAction() {
  return prisma.order.count({ where: { paymentStatus: "PAID", orderStatus: "PENDING" } });
}

// Only paid orders count towards the numbers (a refund-due order was cancelled).
const paid = { paymentStatus: "PAID" } as const;
const live = { ...paid, orderStatus: { not: "CANCELLED" } } as const;

export async function getDashboardStats(now: Date = new Date()) {
  const today = jakartaDayStart(now);
  const since = new Date(now.getTime() - 14 * 86_400_000);

  const [
    totalOrders,
    sales,
    byStatus,
    totalProducts,
    totalCategories,
    recent,
    top,
    todayAgg,
  ] = await Promise.all([
    prisma.order.count({ where: paid }),
    prisma.order.aggregate({ where: live, _sum: { totalAmount: true } }),
    prisma.order.groupBy({ by: ["orderStatus"], where: paid, _count: { _all: true } }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.findMany({
      where: { ...live, orderDate: { gte: since } },
      select: { orderDate: true, totalAmount: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: live },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.aggregate({
      where: { ...live, orderDate: { gte: today } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const count = (status: string) => byStatus.find((g) => g.orderStatus === status)?._count._all ?? 0;

  return {
    totalOrders,
    totalSales: sales._sum.totalAmount ?? 0,
    pending: count("PENDING"),
    preparing: count("PREPARING"),
    ready: count("READY"),
    completed: count("COMPLETED"),
    totalProducts,
    totalCategories,
    todayOrders: todayAgg._count._all,
    todaySales: todayAgg._sum.totalAmount ?? 0,
    salesSeries: buildSalesSeries(recent, now, 14),
    topSellers: top.map((t) => ({ name: t.productName, units: t._sum.quantity ?? 0 })),
  };
}
