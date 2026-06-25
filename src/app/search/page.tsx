import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const trimmed = query.slice(0, 100);

  const products =
    trimmed.length > 0
      ? await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { description: { contains: trimmed, mode: "insensitive" } },
              { origin: { contains: trimmed, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "asc" },
          take: 24,
        })
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="mb-6 flex items-center gap-2 text-sm text-mocha">
        <Link href="/" className="hover:text-espresso">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-espresso">Search</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
        {trimmed ? `Results for “${trimmed}”` : "Search"}
      </h1>

      {!trimmed && (
        <p className="mt-3 text-sm text-mocha">
          Use the search bar above to find beans, drinks, and brew gear.
        </p>
      )}

      {trimmed && products.length === 0 && (
        <p className="mt-12 rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          No products matched “{trimmed}”. Try a different term.
        </p>
      )}

      {products.length > 0 && (
        <p className="mt-3 text-sm text-mocha">
          {products.length} {products.length === 1 ? "result" : "results"}
        </p>
      )}

      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
