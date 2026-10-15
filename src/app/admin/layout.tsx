import { getCurrentUser } from "@/lib/auth";
import { adminLogoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

/**
 * Slim top bar shared by the admin login and the panel. The admin never sees the
 * customer navigation. Authorisation happens in each page, not here.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const admin = user?.role === "ADMIN" ? user : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-latte/70 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href={admin ? "/admin" : "/admin/login"} suffix="Admin" />
          {admin && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden max-w-[16rem] truncate text-mocha sm:inline">{admin.email}</span>
              <form action={adminLogoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-latte bg-white px-3.5 py-1.5 text-sm font-medium text-espresso transition-colors hover:border-caramel"
                >
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </>
  );
}
