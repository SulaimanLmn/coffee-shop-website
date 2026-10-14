"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/** Empties the persisted cart once a payment has been confirmed. */
export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
