import { Prisma } from "@prisma/client";
import type { Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  cancelTransaction,
  createSnapTransaction,
  failureReasonFor,
  fetchTransactionStatus,
  mapTransactionStatus,
  parseGross,
  paymentLabel,
  type MidtransPayload,
} from "@/lib/midtrans";
import {
  checkTransition,
  newMidtransOrderId,
  statusTimestampField,
  type Actor,
  type OrderStatus,
} from "@/lib/orders";

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export type CartLine = { id: string; quantity: number };

export const MAX_LINE_QTY = 20;
export const UNPAID_EXPIRY_MS = 62 * 60_000;

/** Merge duplicate lines and validate shape. Throws OrderError. */
export function normalizeCart(raw: unknown): Map<string, number> {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new OrderError("Your cart is empty.");
  }
  const map = new Map<string, number>();
  for (const item of raw) {
    const id = (item as CartLine)?.id;
    const q = (item as CartLine)?.quantity;
    if (
      typeof id !== "string" ||
      !id ||
      typeof q !== "number" ||
      !Number.isInteger(q) ||
      q <= 0
    ) {
      throw new OrderError("Invalid cart item.");
    }
    map.set(id, (map.get(id) ?? 0) + q);
  }
  for (const [, q] of map) {
    if (q > MAX_LINE_QTY) {
      throw new OrderError(`You can order at most ${MAX_LINE_QTY} of one item.`);
    }
  }
  return map;
}

/**
 * Before starting a new checkout, settle or cancel the user's earlier unpaid
 * orders so abandoned payment attempts do not pile up as duplicate pending orders.
 */
export async function supersedeUnpaidOrders(userId: string) {
  const unpaid = await prisma.order.findMany({
    where: { userId, paymentStatus: "UNPAID", orderStatus: "PENDING" },
  });
  if (unpaid.length === 0) return;
  await syncOrdersPayment(unpaid);
  const stillUnpaid = await prisma.order.findMany({
    where: { userId, paymentStatus: "UNPAID", orderStatus: "PENDING" },
  });
  for (const o of stillUnpaid) {
    try {
      await transitionOrder({
        orderId: o.id,
        to: "CANCELLED",
        actor: "CUSTOMER",
        userId,
        reason: "A newer checkout replaced this order before it was paid.",
      });
    } catch {
      // Raced with another update; nothing to do.
    }
  }
}

/**
 * Create an unpaid PENDING order for available products, then open a Snap
 * transaction. If Midtrans fails the order is marked FAILED/CANCELLED.
 */
export async function createOrderAndSnapToken(args: {
  user: { id: string; fullName: string; email: string; phone: string | null };
  cart: Map<string, number>;
  pickupTime: Date;
  origin: string;
}) {
  const { user, cart, pickupTime, origin } = args;
  const midtransOrderId = newMidtransOrderId();

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...cart.keys()] } },
    });
    if (products.length !== cart.size) {
      throw new OrderError("One or more items are no longer available.", 409);
    }
    for (const p of products) {
      if (!p.isAvailable) {
        throw new OrderError(`Sorry, ${p.name} is currently unavailable.`, 409);
      }
    }
    const total = products.reduce((s, p) => s + p.price * cart.get(p.id)!, 0);
    return tx.order.create({
      data: {
        userId: user.id,
        midtransOrderId,
        pickupTime,
        totalAmount: total,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            productName: p.name,
            quantity: cart.get(p.id)!,
            price: p.price,
          })),
        },
      },
      include: { items: true },
    });
  });

  try {
    const snap = await createSnapTransaction({
      orderId: order.midtransOrderId,
      amount: order.totalAmount,
      items: order.items.map((i) => ({
        id: i.productId ?? i.id,
        name: i.productName,
        price: i.price,
        quantity: i.quantity,
      })),
      customer: { name: user.fullName, email: user.email, phone: user.phone },
      finishUrl: `${origin}/payment/result`,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { snapToken: snap.token },
    });
    return { order, token: snap.token };
  } catch (error) {
    await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "UNPAID" },
      data: {
        paymentStatus: "FAILED",
        orderStatus: "CANCELLED",
        cancelledAt: new Date(),
        failureReason: "The payment could not be started. Please try again.",
      },
    });
    console.error("Snap transaction failed", error);
    throw new OrderError("Unable to start payment. Please try again.", 502);
  }
}

/**
 * Idempotently apply a Midtrans transaction status to an order.
 * Used by both the notification webhook and the status sync on page views.
 */
export async function applyMidtransStatus(
  midtransOrderId: string,
  payload: MidtransPayload
): Promise<Order | null> {
  const mapped = mapTransactionStatus(
    payload.transaction_status,
    payload.fraud_status
  );

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { midtransOrderId },
    });
    if (!order) return null;

    if (
      payload.gross_amount &&
      parseGross(payload.gross_amount) !== order.totalAmount
    ) {
      console.error(`Midtrans amount mismatch for ${midtransOrderId}`);
      return order;
    }

    const method = paymentLabel(payload);

    if (mapped === "PAID") {
      if (order.paymentStatus === "UNPAID") {
        await tx.order.updateMany({
          where: { id: order.id, paymentStatus: "UNPAID" },
          data: { paymentStatus: "PAID", paidAt: new Date(), paymentMethod: method },
        });
      } else if (order.paymentStatus === "PAID" && !order.paymentMethod && method) {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentMethod: method },
        });
      } else if (order.orderStatus === "CANCELLED") {
        console.warn(
          `Late payment for cancelled order ${midtransOrderId}; manual refund needed.`
        );
      }
    } else if (mapped === "FAILED" || mapped === "EXPIRED") {
      await tx.order.updateMany({
        where: { id: order.id, paymentStatus: "UNPAID" },
        data: {
          paymentStatus: mapped,
          orderStatus: "CANCELLED",
          cancelledAt: new Date(),
          paymentMethod: method ?? undefined,
          failureReason: failureReasonFor(payload.transaction_status),
        },
      });
    } else if (mapped === "PENDING" && method && !order.paymentMethod) {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentMethod: method },
      });
    }

    return tx.order.findUnique({ where: { id: order.id } });
  });
}

type Syncable = Pick<Order, "midtransOrderId" | "paymentStatus" | "orderDate">;

/** Pull the latest status from Midtrans for an unpaid order (works without webhooks). */
export async function syncOrderPayment(order: Syncable) {
  if (order.paymentStatus !== "UNPAID") return;
  try {
    const payload = await fetchTransactionStatus(order.midtransOrderId);
    if (payload) {
      await applyMidtransStatus(order.midtransOrderId, payload);
    } else if (Date.now() - order.orderDate.getTime() > UNPAID_EXPIRY_MS) {
      // Payment never started and the Snap window has passed.
      await applyMidtransStatus(order.midtransOrderId, {
        transaction_status: "expire",
      });
    }
  } catch (e) {
    console.warn("Midtrans sync failed", e);
  }
}

export async function syncOrdersPayment(orders: Syncable[]) {
  await Promise.all(
    orders.filter((o) => o.paymentStatus === "UNPAID").map(syncOrderPayment)
  );
}

type TransitionArgs = {
  orderId: string;
  to: OrderStatus;
  actor: Actor;
  userId?: string;
  /** Recorded as the failure reason when an unpaid order is cancelled. */
  reason?: string;
};

/** The one place order status changes happen. Throws OrderError on rule violations. */
export async function transitionOrder({ orderId, to, actor, userId, reason }: TransitionArgs) {
  let midtransIdToCancel: string | null = null;

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });
    if (!order || (actor === "CUSTOMER" && order.userId !== userId)) {
      throw new OrderError("Order not found.", 404);
    }

    // A customer may cancel any Pending order, paid or not.
    const cancellingPending =
      actor === "CUSTOMER" && to === "CANCELLED" && order.orderStatus === "PENDING";
    if (!cancellingPending) {
      const check = checkTransition(
        order.orderStatus,
        to,
        actor,
        order.paymentStatus
      );
      if (!check.ok) throw new OrderError(check.reason, 409);
    }

    const tsField = statusTimestampField(to);
    const data: Prisma.OrderUpdateManyMutationInput = {
      orderStatus: to,
      ...(tsField ? { [tsField]: new Date() } : {}),
    };

    if (to === "CANCELLED") {
      data.paymentStatus = order.paymentStatus === "PAID" ? "REFUND_DUE" : "FAILED";
      if (order.paymentStatus === "UNPAID") {
        data.failureReason = reason ?? "You cancelled this order before paying.";
      }
      if (order.paymentStatus === "UNPAID" || order.paymentStatus === "PAID") {
        midtransIdToCancel = order.midtransOrderId;
      }
    }

    // Compare-and-set on the current status so concurrent actions cannot double apply.
    const res = await tx.order.updateMany({
      where: { id: orderId, orderStatus: order.orderStatus },
      data,
    });
    if (res.count === 0) {
      throw new OrderError("Order was updated by someone else. Refresh and retry.", 409);
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });

  if (midtransIdToCancel) await cancelTransaction(midtransIdToCancel);
  return updated!;
}
