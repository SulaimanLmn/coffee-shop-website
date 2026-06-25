import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getCurrentCustomerId } from "@/lib/auth";
import { shippingFor } from "@/lib/pricing";

type CheckoutItem = { id: string; quantity: number };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { items?: unknown }).items)
  ) {
    return NextResponse.json({ error: "Missing cart items." }, { status: 400 });
  }

  const rawItems = (body as { items: CheckoutItem[] }).items;

  const quantities = new Map<string, number>();
  for (const item of rawItems) {
    if (
      typeof item.id !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid cart item." },
        { status: 400 }
      );
    }
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  }

  if (quantities.size === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...quantities.keys()] } },
  });

  if (products.length !== quantities.size) {
    return NextResponse.json(
      { error: "One or more products are no longer available." },
      { status: 400 }
    );
  }

  for (const product of products) {
    const want = quantities.get(product.id)!;
    if (product.stock < want) {
      return NextResponse.json(
        {
          error: `Sorry, only ${product.stock} × ${product.name} are in stock.`,
        },
        { status: 409 }
      );
    }
  }

  const subtotalCents = products.reduce(
    (sum, p) => sum + p.price * quantities.get(p.id)!,
    0
  );
  const shippingCents = shippingFor(subtotalCents);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = products.map(
    (product) => ({
      quantity: quantities.get(product.id)!,
      price_data: {
        currency: "usd",
        unit_amount: product.price,
        product_data: {
          name: product.name,
          images: [product.imageUrl],
          metadata: { productId: product.id },
        },
      },
    })
  );

  if (shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: shippingCents,
        product_data: {
          name: "Shipping",
        },
      },
    });
  }

  const cartForWebhook = products.map((product) => ({
    id: product.id,
    quantity: quantities.get(product.id)!,
    price: product.price,
  }));

  const customerId = await getCurrentCustomerId();
  const origin = process.env.APP_URL ?? new URL(request.url).origin;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
      metadata: {
        cart: JSON.stringify(cartForWebhook),
        customerId: customerId ?? "",
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 502 }
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
