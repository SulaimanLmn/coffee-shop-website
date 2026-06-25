import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { AddToCartWithQuantity } from "@/components/add-to-cart-with-quantity";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: 3,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/" className="hover:text-espresso">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/category/${product.category}`}
          className="hover:text-espresso"
        >
          {categoryLabel(product.category)}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-latte bg-foam">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-mocha">
            <span className="rounded-full bg-foam px-2.5 py-0.5 font-medium">
              {categoryLabel(product.category)}
            </span>
            {product.origin && (
              <span className="rounded-full bg-foam px-2.5 py-0.5 font-medium">
                {product.origin}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-espresso">
            {formatPrice(product.price)}
          </p>

          <p className="mt-5 text-base leading-relaxed text-mocha">
            {product.description}
          </p>

          {/* Specs */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-latte bg-latte">
            {product.roastLevel && (
              <div className="bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.1em] text-mocha">
                  Roast
                </dt>
                <dd className="mt-1 text-sm font-medium text-espresso">
                  {product.roastLevel}
                </dd>
              </div>
            )}
            {product.origin && (
              <div className="bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.1em] text-mocha">
                  Origin
                </dt>
                <dd className="mt-1 text-sm font-medium text-espresso">
                  {product.origin}
                </dd>
              </div>
            )}
            <div className="bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-mocha">
                Availability
              </dt>
              <dd className="mt-1 text-sm font-medium text-espresso">
                {soldOut
                  ? "Sold out"
                  : lowStock
                    ? `Only ${product.stock} left`
                    : "In stock"}
              </dd>
            </div>
            <div className="bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-mocha">
                Ships
              </dt>
              <dd className="mt-1 text-sm font-medium text-espresso">
                Within 48 hours
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <AddToCartWithQuantity
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                stock: product.stock,
              }}
            />
          </div>

          <Link
            href="/cart"
            className="mt-4 text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            View cart →
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-espresso">
            You might also like
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
