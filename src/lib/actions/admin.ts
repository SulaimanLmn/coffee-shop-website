"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { safeReturn, withParam } from "@/lib/redirects";
import { saveImage } from "@/lib/uploads";
import { isValidImageUrl, parseIntStrict, slugify, str } from "@/lib/validation";

const MAX_PRICE = 10_000_000;
const PRODUCTS = "/admin/products";
const CATEGORIES = "/admin/categories";

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

/** Redirect to `url` carrying a message (shown as a toast for notices, inline for errors). */
function go(url: string, key: "error" | "notice", message: string, field?: string): never {
  let target = withParam(url, key, message);
  if (field) target = withParam(target, "field", field);
  redirect(target);
}

// ---------- Products ----------

type ProductInput = {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  categoryId: string;
  imageUrl: string;
};

/** `list` is where to land after success; `retry` re-opens the drawer when validation fails. */
function productReturns(formData: FormData) {
  const list = safeReturn(formData.get("return"), PRODUCTS, PRODUCTS);
  const retry = safeReturn(formData.get("retry"), list, PRODUCTS);
  return { list, retry };
}

async function readProduct(formData: FormData, retry: string): Promise<ProductInput> {
  const name = str(formData.get("name"), 80);
  const description = str(formData.get("description"), 500);
  const categoryId = str(formData.get("categoryId"), 40);
  const price = parseIntStrict(formData.get("price"), 1, MAX_PRICE);
  // Unchecked checkboxes are absent from FormData, so absence means off.
  const isAvailable = formData.get("isAvailable") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  let imageUrl = str(formData.get("imageUrl"), 500);

  if (!name) go(retry, "error", "Product name is required.", "name");
  if (!description) go(retry, "error", "Description is required.", "description");
  if (price === null) {
    go(
      retry,
      "error",
      `Price must be a whole number of IDR between 1 and ${MAX_PRICE.toLocaleString("en-US")}.`,
      "price"
    );
  }

  const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null;
  if (!category) go(retry, "error", "Please choose a category.", "categoryId");

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if (!saved.ok) go(retry, "error", saved.error, "image");
    imageUrl = saved.url;
  }
  if (!imageUrl) go(retry, "error", "Provide an image URL or upload an image.", "imageUrl");
  if (!isValidImageUrl(imageUrl)) {
    go(retry, "error", "Image URL must start with http:// or https://.", "imageUrl");
  }

  return { name, description, price: price!, isAvailable, isFeatured, categoryId, imageUrl };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const { list, retry } = productReturns(formData);
  const data = await readProduct(formData, retry);
  const product = await prisma.product.create({ data });
  revalidateCatalog();
  go(`${list}#product-${product.id}`, "notice", `${product.name} added to the menu.`);
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const { list, retry } = productReturns(formData);
  const data = await readProduct(formData, retry);
  try {
    await prisma.product.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      go(list, "error", "That product no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  go(`${list}#product-${id}`, "notice", `${data.name} updated.`);
}

/** One-click on/off switch in the product table. */
export async function toggleAvailabilityAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const next = formData.get("next") === "1";
  const { list } = productReturns(formData);
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isAvailable: next },
      select: { name: true },
    });
    revalidateCatalog();
    go(
      `${list}#product-${id}`,
      "notice",
      `${product.name} is now ${next ? "available" : "unavailable"}.`
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      go(list, "error", "That product no longer exists.");
    }
    throw e;
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const { list } = productReturns(formData);
  let name: string;
  try {
    // Past order items keep their own name and price snapshot, so deleting the
    // product only unlinks them (onDelete: SetNull) and order history stays intact.
    ({ name } = await prisma.product.delete({ where: { id }, select: { name: true } }));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      go(list, "error", "That product no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  go(list, "notice", `${name} removed from the menu.`);
}

// ---------- Categories ----------

async function readCategory(formData: FormData, retry: string) {
  const name = str(formData.get("name"), 40);
  const slug = slugify(name);
  if (!name || !slug) go(retry, "error", "Category name is required.");
  return { name, slug };
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const data = await readCategory(formData, CATEGORIES);
  try {
    const created = await prisma.category.create({ data });
    revalidateCatalog();
    go(`${CATEGORIES}#category-${created.id}`, "notice", `${created.name} added.`);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      go(CATEGORIES, "error", "A category with that name already exists.");
    }
    throw e;
  }
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const editing = `${CATEGORIES}?edit=${encodeURIComponent(id)}`;
  const data = await readCategory(formData, editing);
  try {
    await prisma.category.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") go(editing, "error", "A category with that name already exists.");
      if (e.code === "P2025") go(CATEGORIES, "error", "That category no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  go(`${CATEGORIES}#category-${id}`, "notice", `Category renamed to ${data.name}.`);
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    go(
      CATEGORIES,
      "error",
      `This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`
    );
  }
  try {
    await prisma.category.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") go(CATEGORIES, "error", "This category is still in use.");
      if (e.code === "P2025") go(CATEGORIES, "error", "That category no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  go(CATEGORIES, "notice", "Category deleted.");
}
