import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { CartIndicator } from "./cart-indicator";
import { NavLink } from "./nav-link";
import { SearchBar } from "./search-bar";

export async function SiteNav() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

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
            Brew&nbsp;Haven
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-1">
          <NavLink href="/" exact>
            Menu
          </NavLink>
          {user && !isAdmin && <NavLink href="/orders">Orders</NavLink>}
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          <NavLink href="/cart" variant="cart">
            Cart
            <CartIndicator />
          </NavLink>
          {user ? (
            <>
              {!isAdmin && <NavLink href="/profile">{user.fullName.split(" ")[0]}</NavLink>}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-sm font-medium text-mocha transition-colors hover:text-espresso"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <NavLink href="/login">Log in</NavLink>
          )}
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl items-center px-4 pb-2.5 sm:px-6 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
