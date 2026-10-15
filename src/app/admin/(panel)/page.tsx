import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getDashboardStats } from "@/lib/admin-stats";
import { adminOrdersHref } from "@/lib/orders";
import { SalesChart, TopProductsChart } from "@/components/admin-charts";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

const number = (n: number) => n.toLocaleString("en-US");

export default async function AdminDashboard() {
  await requireAdmin();
  const s = await getDashboardStats();

  const now = [
    { label: "Pending", value: s.pending, bar: "bg-status-pending", note: "waiting to start" },
    { label: "Preparing", value: s.preparing, bar: "bg-status-preparing", note: "in the kitchen" },
    { label: "Ready for Pickup", value: s.ready, bar: "bg-status-ready", note: "waiting for customers" },
  ];

  const stats = [
    { label: "Total Orders", value: number(s.totalOrders), href: adminOrdersHref({ view: "history" }) },
    { label: "Total Sales", value: formatPrice(s.totalSales), href: null },
    { label: "Pending Orders", value: number(s.pending), href: adminOrdersHref({}) },
    {
      label: "Completed Orders",
      value: number(s.completed),
      href: adminOrdersHref({ view: "history", status: "COMPLETED" }),
    },
    { label: "Total Products", value: number(s.totalProducts), href: "/admin/products" },
    { label: "Total Categories", value: number(s.totalCategories), href: "/admin/categories" },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" />

      <section aria-labelledby="right-now" className="grid gap-3">
        <h2 id="right-now" className="font-display text-lg font-semibold text-espresso">
          Right now
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {now.map((n) => (
            <Link
              key={n.label}
              href={adminOrdersHref({})}
              className="relative overflow-hidden rounded-2xl border border-latte bg-white p-4 pl-5 transition-shadow hover:shadow-sm"
            >
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${n.bar}`} />
              <span className="text-xs uppercase tracking-[0.1em] text-mocha">{n.label}</span>
              <span className="mt-1 block font-display text-3xl font-semibold tabular-nums text-espresso">
                {n.value}
              </span>
              <span className="text-xs text-mocha">{n.note}</span>
            </Link>
          ))}
          <div className="rounded-2xl border border-latte bg-white p-4">
            <span className="text-xs uppercase tracking-[0.1em] text-mocha">Today&apos;s orders</span>
            <span className="mt-1 block font-display text-3xl font-semibold tabular-nums text-espresso">
              {s.todayOrders}
            </span>
            <span className="text-xs text-mocha">paid, Jakarta time</span>
          </div>
          <div className="rounded-2xl border border-latte bg-white p-4">
            <span className="text-xs uppercase tracking-[0.1em] text-mocha">Today&apos;s sales</span>
            <span className="mt-1 block font-display text-2xl font-semibold tabular-nums text-espresso">
              {formatPrice(s.todaySales)}
            </span>
            <span className="text-xs text-mocha">since midnight</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="overview">
        <h2 id="overview" className="sr-only">
          Overview
        </h2>
        <dl className="grid grid-cols-2 divide-latte overflow-hidden rounded-2xl border border-latte bg-white md:grid-cols-3 xl:grid-cols-6 xl:divide-x">
          {stats.map((st) => (
            <div key={st.label} className="border-b border-latte p-4 last:border-b-0 xl:border-b-0">
              <dt className="text-xs uppercase tracking-[0.1em] text-mocha">
                {st.href ? (
                  <Link href={st.href} className="underline-offset-2 hover:text-espresso hover:underline">
                    {st.label}
                  </Link>
                ) : (
                  st.label
                )}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-espresso">
                {st.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-latte bg-white p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-espresso">Revenue, last 14 days</h2>
          <div className="mt-3">
            <SalesChart data={s.salesSeries} />
          </div>
        </section>

        <section className="rounded-2xl border border-latte bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-espresso">Top Sellers</h2>
          <div className="mt-4">
            <TopProductsChart data={s.topSellers} />
          </div>
        </section>
      </div>
    </div>
  );
}
