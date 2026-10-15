import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_HISTORY_PAGE_SIZE,
  BOARD_STATUSES,
  type AdminOrdersView,
  type OrderStatus,
} from "@/lib/orders";

/** Unpaid/failed attempts never reach the admin; refund-due orders stay visible. */
const ADMIN_VISIBLE = { paymentStatus: { in: ["PAID", "REFUND_DUE"] } } satisfies Prisma.OrderWhereInput;

const include = {
  items: true,
  user: { select: { fullName: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

export type AdminOrder = Prisma.OrderGetPayload<{ include: typeof include }>;

function searchWhere(q: string): Prisma.OrderWhereInput {
  if (!q) return {};
  return {
    OR: [
      { midtransOrderId: { contains: q, mode: "insensitive" } },
      { user: { fullName: { contains: q, mode: "insensitive" } } },
    ],
  };
}

/** Paid orders still in progress (the live board). */
export function getBoardOrders(): Promise<AdminOrder[]> {
  return prisma.order.findMany({
    where: { paymentStatus: "PAID", orderStatus: { in: [...BOARD_STATUSES] } },
    include,
    orderBy: [{ pickupTime: "asc" }, { orderDate: "asc" }],
  });
}

export function countRefundsDue(): Promise<number> {
  return prisma.order.count({ where: { paymentStatus: "REFUND_DUE" } });
}

export async function getHistory(view: Pick<AdminOrdersView, "status" | "q" | "page">) {
  const where: Prisma.OrderWhereInput = {
    ...ADMIN_VISIBLE,
    ...searchWhere(view.q),
    ...(view.status ? { orderStatus: view.status } : {}),
  };
  const [total, grouped] = await Promise.all([
    prisma.order.count({ where }),
    // Chip counts follow the search but not the chosen status.
    prisma.order.groupBy({
      by: ["orderStatus"],
      where: { ...ADMIN_VISIBLE, ...searchWhere(view.q) },
      _count: { _all: true },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / ADMIN_HISTORY_PAGE_SIZE));
  const page = Math.min(view.page, pages);
  const orders = await prisma.order.findMany({
    where,
    include,
    orderBy: { orderDate: "desc" },
    skip: (page - 1) * ADMIN_HISTORY_PAGE_SIZE,
    take: ADMIN_HISTORY_PAGE_SIZE,
  });

  const counts = Object.fromEntries(grouped.map((g) => [g.orderStatus, g._count._all])) as Partial<
    Record<OrderStatus, number>
  >;
  const all = grouped.reduce((n, g) => n + g._count._all, 0);
  return { orders, total, page, pages, counts, all };
}

/** One order for the detail drawer or page; null unless it is visible to the admin. */
export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  const order = await prisma.order.findFirst({ where: { id, ...ADMIN_VISIBLE }, include });
  return order;
}
