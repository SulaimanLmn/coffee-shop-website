import { requireAdmin } from "@/lib/auth";
import { adminLogoutAction } from "@/lib/actions/auth";
import { NavLink } from "@/components/nav-link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-24 md:h-fit">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-caramel-dark">
          Admin
        </p>
        <nav className="flex flex-row flex-wrap gap-1 md:flex-col md:items-stretch" aria-label="Admin">
          <NavLink href="/admin" exact>
            Dashboard
          </NavLink>
          <NavLink href="/admin/orders">Orders</NavLink>
          <NavLink href="/admin/products">Products</NavLink>
          <NavLink href="/admin/categories">Categories</NavLink>
        </nav>
        <div className="mt-6 hidden text-xs text-mocha md:block">
          <p className="truncate">{admin.email}</p>
        </div>
        <form action={adminLogoutAction} className="mt-2">
          <button
            type="submit"
            className="rounded-full px-3 py-2 text-sm font-medium text-mocha transition-colors hover:text-espresso"
          >
            Log out
          </button>
        </form>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
