import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loginAction } from "@/lib/actions/auth";
import { getCurrentUser, safeNext } from "@/lib/auth";
import {
  AuthCard,
  Field,
  Notice,
  inputClass,
  linkClass,
  primaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Log in" };

const errors: Record<string, string> = {
  invalid: "Incorrect email or password.",
  throttled: "Too many attempts. Please wait a few minutes and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const user = await getCurrentUser();
  if (user?.role === "CUSTOMER") redirect(next);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to order and track your coffee."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className={linkClass}>
            Create one
          </Link>
        </>
      }
    >
      <form action={loginAction} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        {sp.registered && <Notice kind="success">Account created. Please log in.</Notice>}
        {sp.reset && <Notice kind="success">Password updated. Please log in.</Notice>}
        {sp.error && errors[sp.error] && <Notice kind="error">{errors[sp.error]}</Notice>}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <div className="text-right text-sm">
          <Link href="/forgot-password" className={linkClass}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" className={primaryButtonClass}>
          Log in
        </button>
      </form>
    </AuthCard>
  );
}
