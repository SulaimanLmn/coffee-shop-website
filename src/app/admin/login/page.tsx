import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { adminLoginAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import {
  AuthCard,
  Field,
  Notice,
  inputClass,
  primaryButtonClass,
} from "@/components/form-kit";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const { error } = await searchParams;
  const failed = error === "invalid" || error === "throttled";

  return (
    <AuthCard title="Admin login" subtitle="Authorised Brew Haven staff only.">
      <form action={adminLoginAction} className="grid gap-4">
        {error === "invalid" && (
          <Notice kind="error">
            <span id="login-error">Incorrect email or password.</span>
          </Notice>
        )}
        {error === "throttled" && (
          <Notice kind="error">
            <span id="login-error">Too many attempts. Please wait a few minutes and try again.</span>
          </Notice>
        )}
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            aria-invalid={failed || undefined}
            aria-describedby={failed ? "login-error" : undefined}
            className={inputClass}
          />
        </Field>
        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          invalid={failed}
          describedBy={failed ? "login-error" : undefined}
        />
        <SubmitButton pendingLabel="Logging in…" className={primaryButtonClass}>
          Login
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
