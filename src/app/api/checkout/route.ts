import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isValidPickup } from "@/lib/pickup";
import {
  OrderError,
  createOrderAndSnapToken,
  normalizeCart,
  supersedeUnpaidOrders,
} from "@/lib/order-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to check out." }, { status: 401 });
  }

  let body: { items?: unknown; pickupTime?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const cart = normalizeCart(body.items);

    if (typeof body.pickupTime !== "string" || !isValidPickup(body.pickupTime)) {
      throw new OrderError("Please choose a valid pickup time.");
    }

    await supersedeUnpaidOrders(user.id);

    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    const { order, token } = await createOrderAndSnapToken({
      user,
      cart,
      pickupTime: new Date(body.pickupTime),
      origin,
    });
    return NextResponse.json({ orderId: order.midtransOrderId, token });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
