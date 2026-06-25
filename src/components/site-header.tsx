import Link from "next/link";
import { CartIndicator } from "./cart-indicator";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-latte/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full bg-espresso text-sm text-cream"
          >
            ☕
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-espresso">
            Bean&nbsp;&amp;&nbsp;Bloom
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            Shop
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 rounded-full border border-latte bg-white px-3 py-2 text-sm font-medium text-espresso transition-colors hover:border-caramel"
          >
            Cart
            <CartIndicator />
          </Link>
        </nav>
      </div>
    </header>
  );
}
