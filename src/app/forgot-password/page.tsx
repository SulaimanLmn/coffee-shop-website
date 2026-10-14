import Link from "next/link";
import type { Metadata } from "next";
import { forgotPasswordAction } from "@/lib/actions/auth";
import {
  AuthCard,
  Field,
  Notice,
  inputClass,
  linkClass,
  primaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  // Dev only: there is no email service, so the link is shown on screen.
  const devLink =
    process.env.NODE_ENV !== "production" && sp.dev?.startsWith("/reset-password/")
      ? sp.dev
      : null;

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your registered email and we will send reset instructions."
      footer={
        <Link href="/login" className={linkClass}>
          Back to log in
        </Link>
      }
    >
      <form action={forgotPasswordAction} className="grid gap-4">
        {sp.error && <Notice kind="error">Please enter a valid email address.</Notice>}
        {sp.sent && (
          <Notice kind="success">
            If that email is registered, password reset instructions have been sent.
          </Notice>
        )}
        {devLink && (
          <Notice kind="info">
            Development mode (no email service configured):{" "}
            <Link href={devLink} className={linkClass}>
              open your reset link
            </Link>
            . It is also printed in the server console.
          </Notice>
        )}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <button type="submit" className={primaryButtonClass}>
          Reset password
        </button>
      </form>
    </AuthCard>
  );
}
