"use client";

import { useCartCount } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";

export function CartIndicator() {
  const hydrated = useHydrated();
  const count = useCartCount();
  const display = hydrated ? count : 0;

  return (
    <span
      aria-label={`${display} items in cart`}
      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-caramel px-1.5 text-xs font-semibold tabular-nums text-white"
    >
      {display}
    </span>
  );
}
