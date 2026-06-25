import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type CartEntry = { id: string; quantity: number; price: number };

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
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const stripeSessionId = session.id;

    const existing = await prisma.order.findUnique({
      where: { stripeSessionId },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const customerEmail = session.customer_details?.email ?? "guest";
    const amount = session.amount_total ?? 0;
    const status = session.payment_status === "paid" ? "PAID" : "PENDING";

    let cart: CartEntry[] = [];
    try {
      cart = JSON.parse(session.metadata?.cart ?? "[]") as CartEntry[];
    } catch {
      cart = [];
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          stripeSessionId,
          customerEmail,
          amount,
          status,
        },
      });

      if (cart.length > 0) {
        await tx.orderItem.createMany({
          data: cart.map((entry) => ({
            orderId: order.id,
            productId: entry.id,
            quantity: entry.quantity,
            price: entry.price,
          })),
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
