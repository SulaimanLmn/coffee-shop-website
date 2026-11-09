import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SORT_OPTIONS,
  listFeatured,
  listProducts,
  parseBrowseParams,
  type BrowseParams,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { MenuFilters } from "@/components/menu-filters";

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
  const [categories, products, featured] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    listProducts(params),
    listFeatured(),
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
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-caramel-dark">
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
              className="mt-8 inline-flex items-center justify-center rounded-full bg-caramel-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coffee"
            >
              View the menu
            </a>
          </div>

          {featured.length > 0 && (
            <aside
              aria-labelledby="featured-heading"
              className="rounded-3xl border border-cream/15 bg-cream/5 p-5"
            >
              <h2
                id="featured-heading"
                className="text-xs font-medium uppercase tracking-[0.18em] text-caramel-dark"
              >
                Featured this week
              </h2>
              <ul className="mt-4 grid gap-3">
                {featured.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.id}`}
                      className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-cream/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl bg-coffee object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-semibold">
                          {p.name}
                        </span>
                        <span className="block text-xs text-cream/70">{p.category.name}</span>
                      </span>
                      <span className="font-display font-semibold tabular-nums">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
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

        <MenuFilters
          q={params.q}
          category={params.category}
          sort={params.sort}
          sortOptions={SORT_OPTIONS}
        />

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
