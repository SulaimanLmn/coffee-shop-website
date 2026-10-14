import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SORT_OPTIONS,
  listProducts,
  parseBrowseParams,
  type BrowseParams,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

function hrefFor(base: BrowseParams, patch: Partial<BrowseParams>): string {
  const next = { ...base, ...patch };
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.category) qs.set("category", next.category);
  if (next.sort !== "menu") qs.set("sort", next.sort);
  const s = qs.toString();
  return `/${s ? `?${s}` : ""}#menu`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseBrowseParams(await searchParams);
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    listProducts(params),
  ]);
  const filtered = !!(params.q || params.category);

  const pill = (active: boolean) =>
    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
    (active
      ? "border-espresso bg-espresso text-cream"
      : "border-latte bg-white text-espresso hover:border-caramel");

  return (
    <>
      <section className="bg-espresso text-cream">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-caramel">
              Order ahead, pick up fresh
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Your daily cup, ready when you arrive.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-cream/75">
              Browse the coffee and dessert menu, pay online, and collect your order at
              the Brew Haven counter.
            </p>
            <a
              href="#menu"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-caramel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
            >
              View the menu
            </a>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-espresso">
          Menu
        </h2>

        <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Filter by category">
          <Link href={hrefFor(params, { category: "" })} className={pill(!params.category)}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={hrefFor(params, { category: c.slug })}
              className={pill(params.category === c.slug)}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <form method="get" action="/" className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="category" value={params.category} />
          <label className="grid gap-1 text-xs font-medium text-mocha">
            Search
            <input
              name="q"
              defaultValue={params.q}
              maxLength={100}
              placeholder="Search by name"
              className="w-56 rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-mocha">
            Sort by
            <select
              name="sort"
              defaultValue={params.sort}
              className="rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-caramel px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
          >
            Apply
          </button>
          {(filtered || params.sort !== "menu") && (
            <Link href="/#menu" className="py-2 text-sm font-medium text-mocha hover:text-espresso">
              Clear
            </Link>
          )}
        </form>

        <p className="mt-4 text-sm text-mocha" aria-live="polite">
          {products.length} {products.length === 1 ? "item" : "items"}
          {params.q ? ` matching “${params.q}”` : ""}
        </p>

        {products.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
            {filtered
              ? "No menu items match your search. Try a different name or category."
              : "No products are available right now. Please check back soon."}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
