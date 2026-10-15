import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  changePasswordAction,
  logoutAction,
  updateProfileAction,
} from "@/lib/actions/auth";
import { AvatarPicker } from "@/components/avatar-picker";
import { Notice, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form-kit";
import { PageHeader } from "@/components/page-header";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

const profileErrors: Record<string, string> = {
  invalid: "Please enter your name and a valid email address.",
  phone: "Enter a valid phone number (8-15 digits).",
  exists: "Another account already uses that email.",
  image: "That image could not be used.",
};
/** Which profile field each error code points at. */
const profileErrorField: Record<string, "name" | "email" | "phone" | "avatar"> = {
  invalid: "email",
  phone: "phone",
  exists: "email",
  image: "avatar",
};
const passwordErrors: Record<string, string> = {
  weak: "New password must be at least 8 characters.",
  mismatch: "New passwords do not match.",
  current: "Your current password is incorrect.",
};
const passwordErrorField: Record<string, "current" | "password" | "confirm"> = {
  weak: "password",
  mismatch: "confirm",
  current: "current",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("/profile");
  const sp = await searchParams;

  const profileError = sp.error ? (sp.msg ?? profileErrors[sp.error] ?? "Could not save.") : null;
  const profileField = sp.error ? profileErrorField[sp.error] : undefined;
  const pwError = sp.pwerror ? passwordErrors[sp.pwerror] : null;
  const pwField = sp.pwerror ? passwordErrorField[sp.pwerror] : undefined;

  const bad = (field: string) => (profileField === field ? true : undefined);
  const describe = (field: string) => (profileField === field ? "profile-error" : undefined);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6">
      <PageHeader
        title="My profile"
        actions={
          <form action={logoutAction}>
            <SubmitButton pendingLabel="Logging out…" className={secondaryButtonClass}>
              Logout
            </SubmitButton>
          </form>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="profile-heading" className="rounded-2xl border border-latte bg-white p-6">
          <h2 id="profile-heading" className="font-display text-lg font-semibold text-espresso">
            Profile
          </h2>
          <form action={updateProfileAction} className="mt-5 grid gap-4">
            {profileError && (
              <div id="profile-error">
                <Notice kind="error">{profileError}</Notice>
              </div>
            )}
            <AvatarPicker
              name="avatar"
              currentUrl={user.avatarUrl}
              initial={user.fullName.charAt(0).toUpperCase()}
              invalid={bad("avatar")}
              describedBy={describe("avatar")}
            />
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-espresso">Full name</span>
              <input
                name="name"
                defaultValue={user.fullName}
                required
                maxLength={80}
                autoComplete="name"
                aria-invalid={bad("name")}
                aria-describedby={describe("name")}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-espresso">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                required
                autoComplete="email"
                aria-invalid={bad("email")}
                aria-describedby={describe("email")}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-espresso">Telephone number</span>
              <input
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ""}
                maxLength={30}
                autoComplete="tel"
                aria-invalid={bad("phone")}
                aria-describedby={`phone-hint${describe("phone") ? " profile-error" : ""}`}
                className={inputClass}
              />
              <span id="phone-hint" className="text-xs text-mocha">
                Optional. 8 to 15 digits.
              </span>
            </label>
            <SubmitButton pendingLabel="Saving…" className={`${primaryButtonClass} justify-self-start`}>
              Save Changes
            </SubmitButton>
          </form>
        </section>

        <section aria-labelledby="password-heading" className="rounded-2xl border border-latte bg-white p-6">
          <h2 id="password-heading" className="font-display text-lg font-semibold text-espresso">
            Password
          </h2>
          <form action={changePasswordAction} className="mt-5 grid gap-4">
            {pwError && (
              <div id="pw-error">
                <Notice kind="error">{pwError}</Notice>
              </div>
            )}
            <PasswordField
              name="current"
              label="Current password"
              autoComplete="current-password"
              invalid={pwField === "current"}
              describedBy={pwField === "current" ? "pw-error" : undefined}
            />
            <PasswordField
              name="password"
              label="New password"
              autoComplete="new-password"
              minLength={8}
              invalid={pwField === "password"}
              describedBy={pwField === "password" ? "pw-error" : undefined}
            />
            <PasswordField
              name="confirm"
              label="Confirm new password"
              autoComplete="new-password"
              invalid={pwField === "confirm"}
              describedBy={pwField === "confirm" ? "pw-error" : undefined}
              hint="Type the new password again."
            />
            <SubmitButton pendingLabel="Updating…" className={`${primaryButtonClass} justify-self-start`}>
              Change Password
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
