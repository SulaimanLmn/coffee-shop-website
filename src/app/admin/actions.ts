"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertAdmin,
  createAdminSession,
  clearAdminSession,
} from "@/lib/admin";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  if (
    typeof password === "string" &&
    password === process.env.ADMIN_PASSWORD
  ) {
    await createAdminSession();
    revalidatePath("/admin");
    redirect("/admin");
  }
  redirect("/admin?error=1");
}

export async function logoutAction() {
  await clearAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

function parseDollars(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function createProductAction(formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const priceDollars = parseDollars(formData.get("price"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);

  if (!name || !description || !imageUrl || priceDollars === null) {
    redirect("/admin?error=invalid");
  }

  await prisma.product.create({
    data: {
      name,
      description,
      imageUrl,
      price: Math.round(priceDollars! * 100),
      stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const priceDollars = parseDollars(formData.get("price"));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);

  if (!id || !name || !description || !imageUrl || priceDollars === null) {
    redirect("/admin?error=invalid");
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      imageUrl,
      price: Math.round(priceDollars! * 100),
      stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteProductAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=invalid");

  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect("/admin?error=in-use");
    }
    redirect("/admin?error=delete-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?deleted=1");
}
