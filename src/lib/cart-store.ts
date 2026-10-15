"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_LINE_QTY = 20;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export type CartProductInfo = Omit<CartItem, "quantity">;

/** Live catalog data used to reconcile a persisted cart. */
export type LiveProduct = CartProductInfo & { isAvailable: boolean };

type CartState = {
  items: CartItem[];
  add: (item: CartProductInfo, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  /** Reconcile with live catalog data: drops unavailable items, refreshes price, clamps qty. */
  reconcile: (live: LiveProduct[]) => { removed: string[]; adjusted: string[] };
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, ...item, quantity: Math.min(i.quantity + qty, MAX_LINE_QTY) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, MAX_LINE_QTY) }],
          };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity: Math.min(quantity, MAX_LINE_QTY) } : i
                ),
        })),
      reconcile: (live) => {
        const byId = new Map(live.map((p) => [p.id, p]));
        const removed: string[] = [];
        const adjusted: string[] = [];
        const next: CartItem[] = [];
        for (const item of get().items) {
          const p = byId.get(item.id);
          if (!p || !p.isAvailable) {
            removed.push(item.name);
            continue;
          }
          const quantity = Math.min(item.quantity, MAX_LINE_QTY);
          if (quantity !== item.quantity || p.price !== item.price) adjusted.push(p.name);
          next.push({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity });
        }
        set({ items: next });
        return { removed, adjusted };
      },
      clear: () => set({ items: [] }),
    }),
    { name: "brew-haven-cart", version: 3, migrate: () => ({ items: [] }) as never }
  )
);

export const useCartCount = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartTotal = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.price * i.quantity, 0));
