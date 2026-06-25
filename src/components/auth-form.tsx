type Props = {
  kind: "login" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  errorCode?: string;
};

const errorMessages: Record<string, string> = {
  invalid: "Please check your details and try again.",
  exists: "An account with that email already exists.",
};

export function AuthForm({ kind, action, errorCode }: Props) {
  const isSignup = kind === "signup";

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-latte bg-white p-8">
        <div className="mb-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-espresso text-xl text-cream"
          >
            ☕
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-mocha">
            {isSignup
              ? "Track orders and check out faster."
              : "Sign in to view your orders."}
          </p>
        </div>

        <form action={action} className="grid gap-4">
          {isSignup && (
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-espresso">Name</span>
              <input
                name="name"
                required
                maxLength={80}
                autoComplete="name"
                className="w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
              />
            </label>
          )}

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-espresso">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-espresso">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={isSignup ? 8 : 1}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
            />
            {isSignup && (
              <span className="text-xs text-mocha">At least 8 characters.</span>
            )}
          </label>

          {errorCode && errorMessages[errorCode] && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessages[errorCode]}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-caramel px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
          >
            {isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-mocha">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <a href="/login" className="font-medium text-caramel-dark hover:text-espresso">
                Sign in
              </a>
            </>
          ) : (
            <>
              New here?{" "}
              <a href="/signup" className="font-medium text-caramel-dark hover:text-espresso">
                Create an account
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
