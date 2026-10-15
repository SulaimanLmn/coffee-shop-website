import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "./add-to-cart";
import { ProductImage } from "./product-image";

type Props = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    category: { name: string };
  };
};

export function ProductCard({ product }: Props) {
  const unavailable = !product.isAvailable;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-latte bg-white transition-shadow hover:shadow-sm">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-foam"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-3 py-1 text-xs font-medium text-white">
            Unavailable
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-mocha">
          <span className="rounded-full bg-foam px-2 py-0.5 font-medium">
            {product.category.name}
          </span>
        </div>

        <h3 className="mt-2 font-display text-lg font-semibold text-espresso">
          <Link href={`/products/${product.id}`} className="hover:text-caramel-dark">
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
            disabled={unavailable}
            disabledLabel="Unavailable"
          />
        </div>
      </div>
    </article>
  );
}
