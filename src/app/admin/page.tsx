import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { isAdmin } from "@/lib/admin";
import { asOrderStatus, categoryLabel } from "@/lib/catalog";
import { logoutAction } from "./actions";
import { LoginForm } from "@/components/admin/login-form";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { StatusBadge } from "@/components/order-status";
import { SalesChart, TopProductsChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error;
  const deleted = params.deleted;
  const editId =
    typeof params.edit === "string" ? params.edit : undefined;

  const admin = await isAdmin();
  if (!admin) {
    return <LoginForm hasError={error === "1"} />;
  }

  const [
    products,
    recentOrders,
    orderCount,
    revenueAgg,
    lowStock,
    topItems,
  ] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 20,
    }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const editingProduct = editId
    ? products.find((p) => p.id === editId) ?? null
    : null;

  const totalRevenue = revenueAgg._sum.amount ?? 0;

  // Sales over the last 14 days
  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const salesOrders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, amount: true },
  });
  for (const o of salesOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + o.amount);
  }
  const salesData = [...dayMap.entries()].map(([key, cents]) => ({
    label: key.slice(5),
    cents,
  }));

  // Top products
  const topProductIds = topItems.map((t) => t.productId);
  const topProducts = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const topData = topItems.map((t) => ({
    name: topProducts.find((p) => p.id === t.productId)?.name ?? "Unknown",
    units: t._sum.quantity ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-mocha">
            Manage products, fulfil orders, and review sales.
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

      {/* Notices */}
      {error === "invalid" && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Some fields were missing or invalid. Please check the form and try
          again.
        </p>
      )}
      {error === "in-use" && (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That product appears in existing orders and can&apos;t be deleted.
        </p>
      )}
      {error === "delete-failed" && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Something went wrong while deleting. Please try again.
        </p>
      )}
      {deleted === "1" && (
        <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Product deleted.
        </p>
      )}

      {/* Stats */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Products
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {products.length}
          </p>
        </div>
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Orders
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {orderCount}
          </p>
        </div>
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Revenue
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {formatPrice(totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-latte bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
            Low stock
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-espresso">
            {lowStock.length}
          </p>
        </div>
      </section>

      {/* Charts */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-latte bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-espresso">
            Revenue · last 14 days
          </h2>
          <div className="mt-4">
            <SalesChart data={salesData} />
          </div>
        </div>
        <div className="rounded-2xl border border-latte bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-espresso">
            Top sellers
          </h2>
          <div className="mt-4">
            <TopProductsChart data={topData} />
          </div>
        </div>
      </section>

      {/* Low-stock alerts */}
      {lowStock.length > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-display text-base font-semibold text-amber-900">
            Low-stock alerts
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-sm text-amber-900"
              >
                <span className="font-medium">{p.name}</span>
                <span className="tabular-nums">
                  {p.stock === 0 ? "sold out" : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Products + form */}
      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="font-display text-xl font-semibold text-espresso">
            Products
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-latte bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-latte">
                {products.map((product) => (
                  <tr key={product.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-foam">
                          <Image
                            src={product.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium text-espresso">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-mocha">
                      {categoryLabel(product.category)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-espresso">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-mocha">
                      <span
                        className={
                          product.stock <= 5 ? "font-semibold text-amber-700" : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`/admin?edit=${product.id}`}
                          className="text-sm font-medium text-caramel-dark transition-colors hover:text-espresso"
                        >
                          Edit
                        </a>
                        <DeleteProductButton
                          id={product.id}
                          name={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-mocha"
                    >
                      No products yet. Add your first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-latte bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-espresso">
            {editingProduct ? "Edit product" : "Add a product"}
          </h2>
          {editingProduct ? (
            <p className="mt-1 text-sm text-mocha">
              Editing &ldquo;{editingProduct.name}&rdquo;.
            </p>
          ) : (
            <p className="mt-1 text-sm text-mocha">
              Fill in the details to list a new coffee.
            </p>
          )}
          <div className="mt-5">
            <ProductForm
              key={editingProduct?.id ?? "new"}
              product={editingProduct ?? undefined}
            />
          </div>
          {editingProduct && (
            <a
              href="/admin"
              className="mt-3 block text-center text-sm font-medium text-mocha transition-colors hover:text-espresso"
            >
              Cancel edit
            </a>
          )}
        </aside>
      </section>

      {/* Orders */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-espresso">
          Recent orders
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-latte bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 text-right font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-mocha">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-espresso">
                    {order.customerEmail}
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
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-caramel-dark hover:text-espresso"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-mocha"
                  >
                    No orders yet. They&apos;ll appear here after the first
                    checkout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {orderCount > recentOrders.length && (
          <p className="mt-3 text-sm text-mocha">
            Showing {recentOrders.length} of {orderCount} orders.
          </p>
        )}
      </section>
    </div>
  );
}
