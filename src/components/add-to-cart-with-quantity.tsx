"use client";

import { useState } from "react";
import { MAX_LINE_QTY, useCart } from "@/lib/cart-store";
import { toast } from "@/lib/toast";
import { formatPrice } from "@/lib/format";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
  };
};

export function AddToCartWithQuantity({ product }: Props) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const unavailable = !product.isAvailable;

  function handleAdd() {
    if (unavailable) return;
    add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      qty
    );
    toast(`${qty} × ${product.name} added to cart`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="inline-flex items-center rounded-full border border-latte bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-11 w-11 place-items-center rounded-full text-espresso transition-colors hover:bg-foam"
        >
          &minus;
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums text-espresso">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(MAX_LINE_QTY, q + 1))}
          className="grid h-11 w-11 place-items-center rounded-full text-espresso transition-colors hover:bg-foam"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={unavailable}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-caramel-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coffee disabled:cursor-not-allowed disabled:bg-latte disabled:text-mocha"
      >
        {unavailable ? "Unavailable" : `Add ${qty} to cart · ${formatPrice(product.price * qty)}`}
      </button>
    </div>
  );
}
