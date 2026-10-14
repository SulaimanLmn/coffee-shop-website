import { randomBytes, createHmac, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/password";

export { hashPassword, verifyPassword, safeEqual } from "@/lib/password";

export const SESSION_COOKIE = "bh_session";
const CUSTOMER_TTL_S = 60 * 60 * 24 * 30;
const ADMIN_TTL_S = 60 * 60 * 8;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not set (min 16 characters)");
  }
  return secret;
}

/** token = userId.expiresAtSeconds.signature */
export function signSession(userId: string, expSeconds: number): string {
  const body = `${userId}.${expSeconds}`;
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifySession(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = createHmac("sha256", sessionSecret())
    .update(`${userId}.${exp}`)
    .digest("hex");
  if (!safeEqual(sig, expected)) return null;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < nowSeconds) return null;
  return userId;
}

export async function createSession(user: Pick<User, "id" | "role">): Promise<void> {
  const ttl = user.role === "ADMIN" ? ADMIN_TTL_S : CUSTOMER_TTL_S;
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(user.id, Math.floor(Date.now() / 1000) + ttl), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = Omit<User, "passwordHash">;

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySession(token);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    omit: { passwordHash: true },
  });
}

function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Require a logged-in user (any role). Redirects to /login otherwise. */
export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext(next))}`);
  return user;
}

/** Require an administrator. Redirects to /admin/login otherwise. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

export function isRole(user: { role: Role } | null, role: Role): boolean {
  return !!user && user.role === role;
}

export { safeNext };

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

// --- very small in-memory login throttle (per process) ---
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 8;

export function loginThrottled(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}
export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else rec.count++;
}
export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
