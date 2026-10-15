import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { availabilityLabel } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
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
  return { title: product.name, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { category: true },
    take: 3,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/" className="hover:text-espresso">
          Menu
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/?category=${product.category.slug}#menu`} className="hover:text-espresso">
          {product.category.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-latte bg-foam">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>

        <div className="flex flex-col">
          <span className="w-fit rounded-full bg-foam px-2.5 py-0.5 text-xs font-medium text-mocha">
            {product.category.name}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-espresso">
            {formatPrice(product.price)}
          </p>
          <p className="mt-5 text-base leading-relaxed text-mocha">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-latte bg-latte">
            <div className="bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Availability</dt>
              <dd className="mt-1 text-sm font-medium text-espresso">
                {availabilityLabel(product.isAvailable)}
              </dd>
            </div>
            <div className="bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-mocha">Collection</dt>
              <dd className="mt-1 text-sm font-medium text-espresso">Pickup at the café</dd>
            </div>
          </dl>

          <div className="mt-8">
            <AddToCartWithQuantity
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                isAvailable: product.isAvailable,
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
