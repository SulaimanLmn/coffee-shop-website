import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type CartEntry = { id: string; quantity: number; price: number };

type ShipInfo = {
  name?: string | null;
  address?: {
    line1?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
} | null;

type SessionWithShipping = Stripe.Checkout.Session & {
  shipping?: ShipInfo;
  shipping_details?: ShipInfo;
};

function parseCart(session: Stripe.Checkout.Session): CartEntry[] {
  try {
    const parsed = JSON.parse(session.metadata?.cart ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CartEntry =>
        typeof e?.id === "string" &&
        typeof e?.quantity === "number" &&
        typeof e?.price === "number"
    );
  } catch {
    return [];
  }
}

function extractShipping(session: Stripe.Checkout.Session) {
  const s = session as SessionWithShipping;
  const ship: ShipInfo = s.shipping ?? s.shipping_details ?? null;
  return {
    shipName: ship?.name ?? null,
    shipLine1: ship?.address?.line1 ?? null,
    shipCity: ship?.address?.city ?? null,
    shipPostalCode: ship?.address?.postal_code ?? null,
    shipCountry: ship?.address?.country ?? null,
  };
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const payload = await request.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const stripeSessionId = session.id;

  try {
    if (event.type === "checkout.session.completed") {
      await handleCompleted(session, stripeSessionId);
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await markPaid(stripeSessionId);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await markCancelled(stripeSessionId);
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[] | undefined)?.includes("stripeSessionId")
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  return NextResponse.json({ received: true });
}

async function handleCompleted(
  session: Stripe.Checkout.Session,
  stripeSessionId: string
) {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId },
  });
  if (existing) return;

  const isPaid = session.payment_status === "paid";
  const cart = parseCart(session);
  const customerId = session.metadata?.customerId || null;
  const shipping = extractShipping(session);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        stripeSessionId,
        customerEmail: session.customer_details?.email ?? "guest",
        amount: session.amount_total ?? 0,
        status: isPaid ? "PAID" : "PENDING",
        paidAt: isPaid ? new Date() : null,
        customerId: customerId ?? null,
        ...shipping,
      },
    });

    if (cart.length > 0) {
      const products = await tx.product.findMany({
        where: { id: { in: cart.map((c) => c.id) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      const missing = cart.filter((c) => !productMap.has(c.id));

      if (missing.length > 0) {
        console.warn(
          `Order ${order.id}: ${missing.length} product(s) no longer exist, skipping their items.`
        );
      }

      const itemsToCreate = cart
        .filter((c) => productMap.has(c.id))
        .map((c) => ({
          orderId: order.id,
          productId: c.id,
          quantity: c.quantity,
          price: c.price,
        }));

      if (itemsToCreate.length > 0) {
        await tx.orderItem.createMany({ data: itemsToCreate });
      }

      if (isPaid) {
        for (const entry of cart) {
          if (productMap.has(entry.id)) {
            await tx.product.update({
              where: { id: entry.id },
              data: { stock: { decrement: entry.quantity } },
            });
          }
        }
      }
    }
  });
}

async function markPaid(stripeSessionId: string) {
  const order = await prisma.order.findUnique({ where: { stripeSessionId } });
  if (!order || order.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { stripeSessionId },
      data: { status: "PAID", paidAt: new Date() },
      include: { items: true },
    });

    for (const item of updated.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });
}

async function markCancelled(stripeSessionId: string) {
  await prisma.order.updateMany({
    where: { stripeSessionId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
