import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import { AddToCart } from "./add-to-cart";

type Props = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    category: string;
    roastLevel?: string | null;
    origin?: string | null;
  };
};

export function ProductCard({ product }: Props) {
  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-latte bg-white transition-shadow hover:shadow-sm">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-foam"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-3 py-1 text-xs font-medium text-cream">
            Sold out
          </span>
        )}
        {!soldOut && lowStock && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-medium text-white">
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-mocha">
          <span className="rounded-full bg-foam px-2 py-0.5 font-medium">
            {categoryLabel(product.category)}
          </span>
          {product.roastLevel && (
            <span className="rounded-full bg-foam px-2 py-0.5 font-medium">
              {product.roastLevel} roast
            </span>
          )}
        </div>

        <h3 className="mt-2 font-display text-lg font-semibold text-espresso">
          <Link href={`/products/${product.id}`} className="hover:text-caramel">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mocha">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold tabular-nums text-espresso">
            {formatPrice(product.price)}
          </span>
          <AddToCart
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
            }}
            disabled={soldOut}
          />
        </div>
      </div>
    </article>
  );
}
