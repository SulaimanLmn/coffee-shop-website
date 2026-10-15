import { prisma } from "@/lib/prisma";

/** Orders that count for the admin: paid, or paid-then-cancelled and awaiting a manual refund. */
export const ADMIN_VISIBLE_PAYMENT = { in: ["PAID", "REFUND_DUE"] } as const;

/** Paid orders nobody has started yet. Drives the sidebar badge and the dashboard. */
export function countOrdersNeedingAction() {
  return prisma.order.count({ where: { paymentStatus: "PAID", orderStatus: "PENDING" } });
}
