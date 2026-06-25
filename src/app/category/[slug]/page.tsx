import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, isCategorySlug, categoryLabel } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategorySlug(slug)) return { title: "Category not found" };
  return {
    title: categoryLabel(slug),
    description:
      CATEGORIES.find((c) => c.slug === slug)?.blurb ?? "Browse our coffee.",
  };
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isCategorySlug(slug)) notFound();

  const category = CATEGORIES.find((c) => c.slug === slug)!;
  const products = await prisma.product.findMany({
    where: { category: slug },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/" className="hover:text-espresso">
          Menu
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-espresso">{category.label}</span>
      </nav>

      <div className="max-w-xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
          {category.label}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mocha">
          {category.blurb}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          Nothing in this category yet. Check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
