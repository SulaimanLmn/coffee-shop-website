"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart, useCartTotal } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/format";
import { pickupSlots } from "@/lib/pickup";
import { toast } from "@/lib/toast";
import { useSnapPay } from "@/components/snap-pay";
import { SandboxPaymentNotice } from "@/components/sandbox-guide";
import { primaryButtonClass } from "@/components/form-kit";

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const reconcile = useCart((s) => s.reconcile);
  const total = useCartTotal();
  const pay = useSnapPay();

  const slots = useMemo(() => (hydrated ? pickupSlots(new Date(), 40) : []), [hydrated]);
  const [pickup, setPickup] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  // Default to the earliest slot once slots are known.
  const selectedPickup = pickup || slots[0]?.value || "";

  // Reconcile the persisted cart with live prices/availability once on load.
  useEffect(() => {
    if (!hydrated) return;
    const ids = useCart.getState().items.map((i) => i.id);
    if (ids.length === 0) return;
    let cancelled = false;
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const { removed, adjusted } = reconcile(data.products);
        if (removed.length) toast(`No longer available: ${removed.join(", ")}`, "error");
        else if (adjusted.length) toast(`Updated price for: ${adjusted.join(", ")}`, "info");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, reconcile]);

  async function handleCheckout() {
    if (items.length === 0 || !selectedPickup) return;
    setSubmitting(true);
    setError("");
    setNeedsLogin(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          pickupTime: selectedPickup,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Unable to start checkout.");
      await pay(data.token, data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">Your cart</h1>
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
          Browse the menu and add a few drinks and treats to get started.
        </p>
        <Link href="/" className={`${primaryButtonClass} mt-8`}>
          Back to Menu
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
          Clear Cart
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col divide-y divide-latte border-y border-latte">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-foam">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-espresso">{item.name}</h2>
                  <p className="font-display font-semibold tabular-nums text-espresso">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-mocha">{formatPrice(item.price)} each</p>

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

        <aside className="h-fit rounded-2xl border border-latte bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-espresso">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-mocha">Subtotal</dt>
              <dd className="font-medium tabular-nums text-espresso">{formatPrice(total)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-latte pt-4">
            <span className="font-display text-base font-semibold text-espresso">Total</span>
            <span className="font-display text-xl font-semibold tabular-nums text-espresso">
              {formatPrice(total)}
            </span>
          </div>

          <label className="mt-5 grid gap-1.5">
            <span className="text-sm font-medium text-espresso">Pickup time</span>
            <select
              value={selectedPickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
            >
              {slots.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-mocha">
              I will collect this order at the café counter.
            </span>
          </label>

          {needsLogin && (
            <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Please{" "}
              <Link href="/login?next=/cart" className="font-semibold underline">
                log in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="font-semibold underline">
                create an account
              </Link>{" "}
              to check out. Your cart will be kept.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting || !selectedPickup}
            className={`${primaryButtonClass} mt-6 w-full`}
          >
            {submitting ? "Preparing payment…" : "Checkout"}
          </button>
          <SandboxPaymentNotice />
          <Link
            href="/"
            className="mt-4 block text-center text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            Back to Menu
          </Link>
        </aside>
      </div>
    </div>
  );
}
