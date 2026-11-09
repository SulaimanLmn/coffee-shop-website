import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { resetPasswordAction } from "@/lib/actions/auth";
import {
  AuthCard,
  Notice,
  linkClass,
  primaryButtonClass,
} from "@/components/form-kit";
import { PasswordField } from "@/components/password-field";

export const metadata: Metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  weak: "Password must be at least 8 characters.",
  mismatch: "Passwords do not match.",
  expired: "This reset link is invalid or has expired.",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await params;
  const { error, demo } = await searchParams;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  const valid = !!record && !record.usedAt && record.expiresAt > new Date();

  if (!valid) {
    return (
      <AuthCard
        title="Link expired"
        footer={
          <Link href="/forgot-password" className={linkClass}>
            Request a new reset link
          </Link>
        }
      >
        <Notice kind="error">{errors.expired}</Notice>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form action={resetPasswordAction} className="grid gap-4">
        <input type="hidden" name="token" value={token} />
        {error && errors[error] && <Notice kind="error">{errors[error]}</Notice>}
        {demo && !error && (
          <Notice kind="info">
            Demo mode: no email was sent. Choose your new password below.
          </Notice>
        )}
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          minLength={8}
        />
        <PasswordField
          name="confirm"
          label="Confirm new password"
          autoComplete="new-password"
          minLength={8}
        />
        <button type="submit" className={primaryButtonClass}>
          Update password
        </button>
      </form>
    </AuthCard>
  );
}
