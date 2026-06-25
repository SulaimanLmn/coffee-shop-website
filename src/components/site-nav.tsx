"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIndicator } from "./cart-indicator";
import { SearchBar } from "./search-bar";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

const navLinkClass = (active: boolean) =>
  "rounded-full px-3 py-2 text-sm font-medium transition-colors " +
  (active ? "bg-espresso text-cream" : "text-mocha hover:text-espresso");

export function SiteNav() {
  const pathname = usePathname();
  const isMenu = pathname === "/" || pathname.startsWith("/category/") || pathname.startsWith("/products/");

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

        <nav className="flex items-center gap-1">
          <Link href="/" className={navLinkClass(isMenu)}>
            Menu
          </Link>
          <Link
            href="/cart"
            className={
              "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors " +
              (isActive(pathname, "/cart")
                ? "bg-espresso text-cream"
                : "border border-latte bg-white text-espresso hover:border-caramel")
            }
          >
            Cart
            <CartIndicator />
          </Link>
          <Link href="/account" className={navLinkClass(isActive(pathname, "/account"))}>
            Account
          </Link>
        </nav>
      </div>

      {/* Search bar on its own row for menu pages */}
      {isMenu && (
        <div className="mx-auto flex max-w-6xl items-center px-4 pb-2.5 sm:px-6">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
