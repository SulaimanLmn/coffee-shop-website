import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-latte/70 bg-foam">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-espresso">
            Brew&nbsp;Haven
          </p>
          <p className="mt-1 max-w-sm text-sm text-mocha">
            Order your coffee online and collect it at the counter when it is ready.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-mocha">
          <Link href="/" className="hover:text-espresso">
            Menu
          </Link>
          <Link href="/cart" className="hover:text-espresso">
            Cart
          </Link>
          <Link href="/orders" className="hover:text-espresso">
            Orders
          </Link>
        </nav>
      </div>
      <div className="border-t border-latte/60">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-mocha sm:px-6">
          &copy;&nbsp;{new Date().getFullYear()} Brew&nbsp;Haven &middot; Open daily 7am&ndash;6pm (WIB) &middot; Pickup only &middot; Payments run in Midtrans Sandbox.
        </p>
      </div>
    </footer>
  );
}
