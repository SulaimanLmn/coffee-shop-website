import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

const features = [
  { label: "Roasted to order", value: "Within 48 hours of shipping" },
  { label: "Free shipping", value: "On every order over $40" },
  { label: "Single-origin", value: "Ethically sourced beans" },
];

export default async function Home() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-espresso text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-caramel">
              Roasted to order
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Coffee worth slowing down for.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-cream/75 sm:text-lg">
              Single-origin beans, slow-steeped cold brew, and velvety lattes —
              roasted in small batches and shipped the day they&apos;re ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="inline-flex items-center justify-center rounded-full bg-caramel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
              >
                Shop the menu
              </a>
              <a
                href="#categories"
                className="inline-flex items-center justify-center rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-cream/60"
              >
                Explore the range
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-cream/10 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1000&q=80"
                alt="A barista pouring latte art into a cup"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-2xl border border-latte bg-cream px-5 py-4 text-espresso shadow-sm sm:-left-5">
              <p className="font-display text-2xl font-semibold tabular-nums">
                4.9
              </p>
              <p className="text-xs text-mocha">2,300+ cups shipped</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-latte/70 bg-foam">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
                {f.label}
              </p>
              <p className="text-sm text-espresso">{f.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6"
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight text-espresso">
          Browse by category
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group rounded-2xl border border-latte bg-white p-6 transition-colors hover:border-caramel"
              >
                <p className="font-display text-xl font-semibold text-espresso group-hover:text-caramel">
                  {cat.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mocha">
                  {cat.blurb}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-caramel-dark">
                  {count} {count === 1 ? "item" : "items"} →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Menu */}
      <section
        id="menu"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
              The menu
            </h2>
            <p className="mt-2 text-sm text-mocha">
              Roasted fresh and ready to ship.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
            No products are available right now. Please check back soon.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
