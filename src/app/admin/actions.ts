"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/pricing";
import {
  assertAdmin,
  createAdminSession,
  clearAdminSession,
} from "@/lib/admin";
import {
  asOrderStatus,
  nextStatus,
  statusTimestampField,
  isCategorySlug,
} from "@/lib/catalog";

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

function parseStock(value: FormDataEntryValue | null): number {
  const n = parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function productDataFromForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const priceDollars = parseDollars(formData.get("price"));
  const category = String(formData.get("category") ?? "hot-coffee").trim();

  return {
    name,
    description,
    imageUrl,
    priceDollars,
    category: isCategorySlug(category) ? category : "hot-coffee",
  };
}

export async function createProductAction(formData: FormData) {
  await assertAdmin();

  const data = productDataFromForm(formData);
  if (!data.name || !data.description || !data.imageUrl || data.priceDollars === null) {
    redirect("/admin?error=invalid");
  }

  await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      price: toCents(data.priceDollars!),
      stock: parseStock(formData.get("stock")),
      category: data.category,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const data = productDataFromForm(formData);
  if (!id || !data.name || !data.description || !data.imageUrl || data.priceDollars === null) {
    redirect("/admin?error=invalid");
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      price: toCents(data.priceDollars!),
      stock: parseStock(formData.get("stock")),
      category: data.category,
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

export async function advanceOrderStatusAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) redirect("/admin");

  const current = asOrderStatus(order.status);
  const next = nextStatus(current);
  if (!next) redirect(`/admin/orders/${id}`);

  const timestampField = statusTimestampField(next);
  await prisma.order.update({
    where: { id },
    data: {
      status: next,
      ...(timestampField ? { [timestampField]: new Date() } : {}),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders/" + id);
  revalidatePath("/account");
  redirect(`/admin/orders/${id}`);
}

export async function cancelOrderAction(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order || order.status === "CANCELLED") return;

    const wasPaid = order.status !== "PENDING";
    if (wasPaid) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders/" + id);
  revalidatePath("/account");
  redirect(`/admin/orders/${id}`);
}
