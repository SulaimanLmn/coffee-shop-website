"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  clearLoginFailures,
  clearSession,
  createSession,
  hashPassword,
  hashToken,
  loginThrottled,
  newResetToken,
  recordLoginFailure,
  requireUser,
  safeNext,
  verifyPassword,
} from "@/lib/auth";
import {
  normalizeEmail,
  normalizePhone,
  str,
  validatePassword,
} from "@/lib/validation";
import { saveImage } from "@/lib/uploads";
import { mailConfigured, sendPasswordResetEmail } from "@/lib/mailer";

const RESET_TTL_MS = 60 * 60_000;

async function clientKey(email: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${ip}|${email}`;
}

export async function signupAction(formData: FormData) {
  const fullName = str(formData.get("name"), 80);
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!fullName || !email) redirect("/signup?error=invalid");
  if (validatePassword(password)) redirect("/signup?error=weak");
  if (password !== confirm) redirect("/signup?error=mismatch");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/signup?error=exists");

  try {
    await prisma.user.create({
      data: { fullName, email, passwordHash: await hashPassword(password) },
    });
  } catch {
    redirect("/signup?error=exists"); // lost a race on the unique email
  }
  redirect("/login?registered=1");
}

async function authenticate(formData: FormData, role: "CUSTOMER" | "ADMIN") {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email) return { error: "invalid" as const };

  const key = await clientKey(email);
  if (loginThrottled(key)) return { error: "throttled" as const };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    !!user &&
    user.role === role &&
    (await verifyPassword(password, user.passwordHash));
  if (!valid || !user) {
    recordLoginFailure(key);
    return { error: "invalid" as const };
  }
  clearLoginFailures(key);
  await createSession(user);
  return { user };
}

export async function loginAction(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const result = await authenticate(formData, "CUSTOMER");
  if (result.error) {
    const q = new URLSearchParams({ error: result.error });
    if (next !== "/") q.set("next", next);
    redirect(`/login?${q}`);
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function adminLoginAction(formData: FormData) {
  const result = await authenticate(formData, "ADMIN");
  if (result.error) redirect(`/admin/login?error=${result.error}`);
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function adminLogoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

/** Stores a single-use reset token (hash only) and returns the raw token for the link. */
async function issueResetToken(userId: string): Promise<string> {
  const { raw, hash } = newResetToken();
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return raw;
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (!email) redirect("/forgot-password?error=invalid");

  const user = await prisma.user.findUnique({ where: { email } });
  // Administrator accounts are pre-configured and are never reset from this page.
  const customer = user && user.role === "CUSTOMER" ? user : null;

  if (!mailConfigured()) {
    // Demonstration mode (no mail server, e.g. the deployed demo): skip the email step and
    // open the new-password page straight away. Unregistered emails get an error (Section 3.2).
    if (!customer) redirect("/forgot-password?error=notfound");
    const raw = await issueResetToken(customer.id);
    redirect(`/reset-password/${raw}?demo=1`);
  }

  if (customer) {
    const raw = await issueResetToken(customer.id);
    const origin = process.env.APP_URL ?? "http://localhost:3000";
    const link = `${origin}/reset-password/${raw}`;
    const emailed = await sendPasswordResetEmail(email, customer.fullName, link);
    if (!emailed) console.log(`[password reset] email to ${email} failed; link: ${link}`);
  }
  // With email: the same response whether or not the account exists (no account enumeration).
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const back = `/reset-password/${encodeURIComponent(token)}`;

  if (validatePassword(password)) redirect(`${back}?error=weak`);
  if (password !== confirm) redirect(`${back}?error=mismatch`);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    redirect(`${back}?error=expired`);
  }

  const passwordHash = await hashPassword(password);
  const claimed = await prisma.$transaction(async (tx) => {
    // Single use: only one request can flip usedAt from null.
    const res = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (res.count === 0) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    return true;
  });
  if (!claimed) redirect(`${back}?error=expired`);
  redirect("/login?reset=1");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser("/profile");
  const fullName = str(formData.get("name"), 80);
  const email = normalizeEmail(formData.get("email"));
  const phoneRaw = str(formData.get("phone"), 30);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

  if (!fullName || !email) redirect("/profile?error=invalid");
  if (phoneRaw && !phone) redirect("/profile?error=phone");

  const taken = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
  });
  if (taken) redirect("/profile?error=exists");

  let avatarUrl = user.avatarUrl;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if (!saved.ok) {
      redirect(`/profile?error=image&msg=${encodeURIComponent(saved.error)}`);
    }
    avatarUrl = saved.url;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName, email, phone, avatarUrl },
  });
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser("/profile");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (validatePassword(next)) redirect("/profile?pwerror=weak");
  if (next !== confirm) redirect("/profile?pwerror=mismatch");

  const row = await prisma.user.findUnique({ where: { id: user.id } });
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    redirect("/profile?pwerror=current");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  redirect("/profile?pwsaved=1");
}
