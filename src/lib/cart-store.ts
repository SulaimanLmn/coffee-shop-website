"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_LINE_QTY = 20;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  quantity: number;
};

export type CartProductInfo = Omit<CartItem, "quantity">;

type CartState = {
  items: CartItem[];
  add: (item: CartProductInfo, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  /** Reconcile with live catalog data: drops unavailable items, refreshes price/stock, clamps qty. */
  reconcile: (live: CartProductInfo[]) => { removed: string[]; adjusted: string[] };
  clear: () => void;
};

const cap = (stock: number) => Math.max(0, Math.min(stock, MAX_LINE_QTY));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          const limit = cap(item.stock);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, ...item, quantity: Math.min(i.quantity + qty, limit) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, limit) }],
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
                  i.id === id ? { ...i, quantity: Math.min(quantity, cap(i.stock)) } : i
                ),
        })),
      reconcile: (live) => {
        const byId = new Map(live.map((p) => [p.id, p]));
        const removed: string[] = [];
        const adjusted: string[] = [];
        const next: CartItem[] = [];
        for (const item of get().items) {
          const p = byId.get(item.id);
          if (!p || p.stock <= 0) {
            removed.push(item.name);
            continue;
          }
          const quantity = Math.min(item.quantity, cap(p.stock));
          if (quantity !== item.quantity || p.price !== item.price) adjusted.push(p.name);
          next.push({ ...item, ...p, quantity });
        }
        set({ items: next });
        return { removed, adjusted };
      },
      clear: () => set({ items: [] }),
    }),
    { name: "brew-haven-cart", version: 2, migrate: () => ({ items: [] }) as never }
  )
);

export const useCartCount = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartTotal = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.price * i.quantity, 0));
