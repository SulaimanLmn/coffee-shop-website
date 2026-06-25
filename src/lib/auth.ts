import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Customer } from "@prisma/client";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const SESSION_COOKIE = "customer_session";
const KEYLEN = 64;

function sessionSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_SESSION_SECRET is not set");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const hash = await scrypt(password, salt, KEYLEN);
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

function signToken(customerId: string): string {
  const hmac = createHmac("sha256", sessionSecret()).update(customerId);
  return `${customerId}.${hmac.digest("hex")}`;
}

function verifyToken(token: string): string | null {
  const idx = token.indexOf(".");
  if (idx === -1) return null;
  const customerId = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = createHmac("sha256", sessionSecret())
    .update(customerId)
    .digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return customerId;
}

export async function createCustomerSession(customerId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signToken(customerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const customerId = verifyToken(token);
  if (!customerId) return null;
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  }) as Promise<Customer | null>;
}

export async function getCurrentCustomerId(): Promise<string | null> {
  const customer = await getCurrentCustomer();
  return customer?.id ?? null;
}
