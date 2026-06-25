import Link from "next/link";
import { CartIndicator } from "./cart-indicator";
import { SearchBar } from "./search-bar";
import { CATEGORIES } from "@/lib/catalog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-latte/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
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

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 rounded-full border border-latte bg-white px-3 py-2 text-sm font-medium text-espresso transition-colors hover:border-caramel"
          >
            Cart
            <CartIndicator />
          </Link>
          <Link
            href="/account"
            className="rounded-full px-3 py-2 text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            Account
          </Link>
        </nav>
      </div>

      {/* Category sub-nav */}
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
        <Link
          href="/"
          className="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium text-mocha transition-colors hover:text-espresso"
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            {cat.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
