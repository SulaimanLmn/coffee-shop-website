import { NextResponse } from "next/server";
import {
  verifyNotificationSignature,
  type MidtransPayload,
} from "@/lib/midtrans";
import { applyMidtransStatus } from "@/lib/order-service";

/** Midtrans HTTP notification endpoint. Idempotent and signature-verified. */
export async function POST(request: Request) {
  let payload: MidtransPayload;
  try {
    payload = (await request.json()) as MidtransPayload;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!verifyNotificationSignature(payload)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  const order = await applyMidtransStatus(payload.order_id!, payload);
  if (!order) return NextResponse.json({ error: "Unknown order." }, { status: 404 });
  return NextResponse.json({ received: true });
}
