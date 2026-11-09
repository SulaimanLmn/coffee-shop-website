import Link from "next/link";
import type { Metadata } from "next";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { mailConfigured } from "@/lib/mailer";
import {
  AuthCard,
  Field,
  Notice,
  inputClass,
  linkClass,
  primaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Forgot password" };

const errors: Record<string, string> = {
  invalid: "Please enter a valid email address.",
  notfound: "No customer account is registered with that email address.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  // Without a mail server (the deployed demo) the reset skips the email step.
  const demo = !mailConfigured();

  return (
    <AuthCard
      title="Reset your password"
      subtitle={
        demo
          ? "Enter the email address of your account to choose a new password."
          : "Enter your registered email and we will send reset instructions."
      }
      footer={
        <Link href="/login" className={linkClass}>
          Back to log in
        </Link>
      }
    >
      <form action={forgotPasswordAction} className="grid gap-4">
        {sp.error && errors[sp.error] && <Notice kind="error">{errors[sp.error]}</Notice>}
        {!demo && sp.sent && (
          <Notice kind="success">
            If that email is registered, password reset instructions have been sent.
          </Notice>
        )}
        {demo && (
          <Notice kind="info">
            Demo mode: this site does not send emails. After you enter your registered email, you
            can choose a new password straight away.
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
