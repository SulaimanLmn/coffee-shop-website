import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { syncOrderPayment } from "@/lib/order-service";
import { failureReasonFor } from "@/lib/midtrans";
import { ClearCartOnMount } from "@/components/clear-cart";
import { PayButton } from "@/components/snap-pay";
import { SandboxSteps } from "@/components/sandbox-guide";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form-kit";

export const metadata: Metadata = { title: "Payment result" };
export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = sp.order_id ?? "";
  const user = await requireUser(`/payment/result?order_id=${encodeURIComponent(orderId)}`);

  const found = orderId
    ? await prisma.order.findFirst({ where: { midtransOrderId: orderId, userId: user.id } })
    : null;

  if (!found) {
    return (
      <Shell title="Order not found">
        <p className="text-mocha">We could not find that order.</p>
        <Link href="/orders" className={secondaryButtonClass}>
          View Order History
        </Link>
      </Shell>
    );
  }

  await syncOrderPayment(found);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: found.id } });

  if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUND_DUE") {
    return (
      <Shell title="Thank you for your order!">
        <ClearCartOnMount />
        <p className="text-mocha">
          Payment received for order <span className="font-mono">{order.midtransOrderId}</span>. Your
          coffee is being prepared. We will have it ready at the pickup counter.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className={secondaryButtonClass}>
            Continue Shopping
          </Link>
          <Link href="/orders" className={primaryButtonClass}>
            View Order History
          </Link>
          <Link href={`/orders/${order.id}/receipt`} className={secondaryButtonClass}>
            View receipt
          </Link>
        </div>
      </Shell>
    );
  }

  if (order.paymentStatus === "UNPAID") {
    return (
      <Shell title="Payment not completed">
        <p className="text-mocha">
          Your payment has not been completed yet. If you already paid, it may take a moment to be
          confirmed. Refresh this page, or try again.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PayButton orderId={order.midtransOrderId} label="Try Again" className={primaryButtonClass} />
          <Link href="/cart" className={secondaryButtonClass}>
            Back to Cart
          </Link>
        </div>
        <div className="w-full rounded-xl border border-dashed border-caramel bg-foam/60 p-4 text-left">
          <p className="mb-3 text-sm font-semibold text-espresso">
            Paying in test mode (Midtrans Sandbox)
          </p>
          <SandboxSteps />
        </div>
      </Shell>
    );
  }

  const reason =
    order.failureReason ??
    failureReasonFor(order.paymentStatus === "EXPIRED" ? "expire" : undefined);

  return (
    <Shell title="Payment failed">
      <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
        <p className="font-semibold">Reason</p>
        <p>{reason}</p>
      </div>
      <p className="text-sm text-mocha">Your cart is still saved. Nothing was charged for this attempt.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/cart" className={primaryButtonClass}>
          Try Again
        </Link>
        <Link href="/cart" className={secondaryButtonClass}>
          Back to Cart
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">{title}</h1>
      {children}
    </div>
  );
}
