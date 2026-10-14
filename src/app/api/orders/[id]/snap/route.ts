import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncOrderPayment } from "@/lib/order-service";

/** Returns the Snap token of the caller's own unpaid order so payment can be retried. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { midtransOrderId: id, userId: user.id },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  await syncOrderPayment(order);
  const fresh = await prisma.order.findUnique({ where: { id: order.id } });

  if (!fresh || fresh.paymentStatus !== "UNPAID" || fresh.orderStatus !== "PENDING" || !fresh.snapToken) {
    return NextResponse.json(
      { error: "This order can no longer be paid.", paymentStatus: fresh?.paymentStatus },
      { status: 409 }
    );
  }
  return NextResponse.json({ token: fresh.snapToken, orderId: fresh.midtransOrderId });
}
