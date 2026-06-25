"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { toast } from "@/lib/toast";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  disabled?: boolean;
  className?: string;
};

export function AddToCart({ product, disabled, className }: Props) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (disabled) return;
    add(product);
    setAdded(true);
    toast(`${product.name} added to cart`);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={
        "inline-flex items-center justify-center rounded-full bg-caramel px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark disabled:cursor-not-allowed disabled:bg-latte disabled:text-mocha " +
        (className ?? "")
      }
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
