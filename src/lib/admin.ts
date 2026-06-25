import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function sessionToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256")
    .update(`coffee-shop-admin::${password}`)
    .digest("hex");
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === sessionToken();
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}
