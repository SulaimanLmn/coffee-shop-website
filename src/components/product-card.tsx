import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "./add-to-cart";

type Props = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
};

export function ProductCard({ product }: Props) {
  const soldOut = product.stock <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-latte bg-white transition-shadow hover:shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-foam">
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
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-espresso">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mocha">
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
