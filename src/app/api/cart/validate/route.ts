import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Returns live catalog data for cart item ids so the client can reconcile price/availability. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length > 100 || ids.some((i) => typeof i !== "string")) {
    return NextResponse.json({ error: "Invalid ids." }, { status: 400 });
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids as string[] } },
    select: { id: true, name: true, price: true, imageUrl: true, isAvailable: true },
  });
  return NextResponse.json({ products });
}
