"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart, useCartTotal } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCartTotal();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = items.map((i) => ({ id: i.id, quantity: i.quantity }));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
          Your cart
        </h1>
        <p className="mt-6 text-sm text-mocha">Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-mocha">
          Browse the menu and add a few bags of freshly roasted coffee to get
          started.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-caramel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
          Your cart
        </h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-mocha transition-colors hover:text-espresso"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <ul className="flex flex-col divide-y divide-latte border-y border-latte">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-foam">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-espresso">
                    {item.name}
                  </h2>
                  <p className="font-display font-semibold tabular-nums text-espresso">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-mocha">
                  {formatPrice(item.price)} each
                </p>

                <div className="mt-auto flex items-center gap-4 pt-3">
                  <div className="inline-flex items-center rounded-full border border-latte">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className="grid h-9 w-9 place-items-center rounded-full text-espresso transition-colors hover:bg-foam"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-espresso">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className="grid h-9 w-9 place-items-center rounded-full text-espresso transition-colors hover:bg-foam"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="text-sm font-medium text-mocha transition-colors hover:text-espresso"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-latte bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-espresso">
            Order summary
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-mocha">Subtotal</dt>
              <dd className="font-medium tabular-nums text-espresso">
                {formatPrice(total)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-mocha">Shipping</dt>
              <dd className="font-medium tabular-nums text-espresso">
                {total >= 4000 ? "Free" : formatPrice(500)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-latte pt-4">
            <span className="font-display text-base font-semibold text-espresso">
              Total
            </span>
            <span className="font-display text-xl font-semibold tabular-nums text-espresso">
              {formatPrice(total + (total >= 4000 ? 0 : 500))}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-caramel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark disabled:cursor-not-allowed disabled:bg-latte disabled:text-mocha"
          >
            {submitting ? "Redirecting to checkout…" : "Checkout"}
          </button>
          <p className="mt-3 text-center text-xs text-mocha">
            Secure payment handled by Stripe.
          </p>
          <Link
            href="/"
            className="mt-4 block text-center text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
