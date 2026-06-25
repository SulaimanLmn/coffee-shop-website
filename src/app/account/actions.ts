"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createCustomerSession,
  clearCustomerSession,
  getCurrentCustomer,
} from "@/lib/auth";

function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !name || password.length < 8) {
    redirect("/signup?error=invalid");
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    redirect("/signup?error=exists");
  }

  const customer = await prisma.customer.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });

  await createCustomerSession(customer.id);
  revalidatePath("/");
  redirect("/account");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email) {
    redirect("/login?error=invalid");
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  const valid =
    customer && (await verifyPassword(password, customer.passwordHash));

  if (!valid) {
    redirect("/login?error=invalid");
  }

  await createCustomerSession(customer!.id);
  revalidatePath("/");
  redirect("/account");
}

export async function logoutAction() {
  await clearCustomerSession();
  revalidatePath("/");
  redirect("/");
}

export async function getCustomerOrNull() {
  return getCurrentCustomer();
}
