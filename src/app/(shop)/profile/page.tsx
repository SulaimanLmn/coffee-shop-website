import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  changePasswordAction,
  logoutAction,
  updateProfileAction,
} from "@/lib/actions/auth";
import {
  Field,
  Notice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

const profileErrors: Record<string, string> = {
  invalid: "Please enter your name and a valid email address.",
  phone: "Enter a valid phone number (8-15 digits).",
  exists: "Another account already uses that email.",
  image: "That image could not be used.",
};
const passwordErrors: Record<string, string> = {
  weak: "New password must be at least 8 characters.",
  mismatch: "New passwords do not match.",
  current: "Your current password is incorrect.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("/profile");
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">
        My profile
      </h1>

      <section className="mt-8 rounded-2xl border border-latte bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">Account details</h2>
        <form action={updateProfileAction} className="mt-4 grid gap-4">
          {sp.saved && <Notice kind="success">Profile updated.</Notice>}
          {sp.error && (
            <Notice kind="error">{sp.msg ?? profileErrors[sp.error] ?? "Could not save."}</Notice>
          )}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-latte bg-foam">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-xl text-mocha">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <Field label="Profile picture" hint="PNG, JPEG or WebP, up to 2 MB.">
              <input
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="text-sm text-mocha"
              />
            </Field>
          </div>
          <Field label="Full name">
            <input name="name" defaultValue={user.fullName} required maxLength={80} className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={user.email} required className={inputClass} />
          </Field>
          <Field label="Phone number" hint="Optional.">
            <input name="phone" type="tel" defaultValue={user.phone ?? ""} maxLength={30} className={inputClass} />
          </Field>
          <button type="submit" className={`${primaryButtonClass} justify-self-start`}>
            Save changes
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-latte bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">Change password</h2>
        <form action={changePasswordAction} className="mt-4 grid gap-4">
          {sp.pwsaved && <Notice kind="success">Password changed.</Notice>}
          {sp.pwerror && passwordErrors[sp.pwerror] && (
            <Notice kind="error">{passwordErrors[sp.pwerror]}</Notice>
          )}
          <Field label="Current password">
            <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="Confirm new password">
            <input name="confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className={inputClass} />
          </Field>
          <button type="submit" className={`${primaryButtonClass} justify-self-start`}>
            Update password
          </button>
        </form>
      </section>

      <form action={logoutAction} className="mt-6">
        <button type="submit" className={secondaryButtonClass}>
          Log out
        </button>
      </form>
    </div>
  );
}
