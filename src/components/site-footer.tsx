import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-latte/70 bg-foam">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-espresso">
            Bean&nbsp;&amp;&nbsp;Bloom
          </p>
          <p className="mt-1 max-w-sm text-sm text-mocha">
            Small-batch specialty coffee, roasted to order and shipped fresh
            from our roastery.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-mocha">
          <Link href="/" className="hover:text-espresso">
            Shop
          </Link>
          <Link href="/cart" className="hover:text-espresso">
            Cart
          </Link>
          <Link href="/account" className="hover:text-espresso">
            Account
          </Link>
        </nav>
      </div>
      <div className="border-t border-latte/60">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-mocha sm:px-6">
          &copy;&nbsp;{new Date().getFullYear()} Bean&nbsp;&amp;&nbsp;Bloom. Built for a final project.
        </p>
      </div>
    </footer>
  );
}
