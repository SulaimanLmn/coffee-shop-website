import { loginAction } from "@/app/admin/actions";

export function LoginForm({ hasError }: { hasError: boolean }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-latte bg-white p-8">
        <div className="mb-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-espresso text-xl text-cream"
          >
            ☕
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-mocha">
            Enter your password to manage the store.
          </p>
        </div>

        <form action={loginAction} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-espresso">Password</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
            />
          </label>

          {hasError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Incorrect password. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-caramel px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
