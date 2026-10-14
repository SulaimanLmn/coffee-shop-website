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

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const { error } = await searchParams;

  return (
    <AuthCard title="Admin login" subtitle="Authorised Brew Haven staff only.">
      <form action={adminLoginAction} className="grid gap-4">
        {error === "invalid" && <Notice kind="error">Incorrect email or password.</Notice>}
        {error === "throttled" && (
          <Notice kind="error">Too many attempts. Please wait a few minutes and try again.</Notice>
        )}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="username" className={inputClass} />
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
        <button type="submit" className={primaryButtonClass}>
          Log in
        </button>
      </form>
    </AuthCard>
  );
}
