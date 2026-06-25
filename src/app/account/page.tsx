import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { logoutAction } from "./actions";
import { formatPrice } from "@/lib/format";
import { asOrderStatus } from "@/lib/catalog";
import { StatusBadge } from "@/components/order-status";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/login?next=/account");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
            Your account
          </h1>
          <p className="mt-1 text-sm text-mocha">
            {customer.name} · {customer.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-latte bg-white px-4 py-2 text-sm font-medium text-espresso transition-colors hover:border-caramel"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Orders
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {orders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Total spent
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {formatPrice(totalSpent)}
          </p>
        </div>
      </div>

      {/* Orders */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-espresso">
          Order history
        </h2>

        {orders.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/" className="font-medium text-caramel-dark hover:text-espresso">
              Start shopping
            </Link>
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-latte bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Items</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-latte">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-mocha">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-mocha">
                      {order.items.reduce((n, i) => n + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asOrderStatus(order.status)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm font-medium text-caramel-dark hover:text-espresso"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
