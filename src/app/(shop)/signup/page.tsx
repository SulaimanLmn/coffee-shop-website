import Link from "next/link";
import type { Metadata } from "next";
import { signupAction } from "@/lib/actions/auth";
import {
  AuthCard,
  Field,
  Notice,
  inputClass,
  linkClass,
  primaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Create account" };

const errors: Record<string, string> = {
  invalid: "Please enter your name and a valid email address.",
  weak: "Password must be at least 8 characters.",
  mismatch: "Passwords do not match.",
  exists: "An account with that email already exists.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      title="Create your account"
      subtitle="Order ahead and skip the queue."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form action={signupAction} className="grid gap-4">
        {error && errors[error] && <Notice kind="error">{errors[error]}</Notice>}
        <Field label="Full name">
          <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm password">
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <button type="submit" className={primaryButtonClass}>
          Create account
        </button>
      </form>
    </AuthCard>
  );
}
