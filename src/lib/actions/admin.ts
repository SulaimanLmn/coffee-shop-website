"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/uploads";
import { isValidImageUrl, parseIntStrict, slugify, str } from "@/lib/validation";

const MAX_PRICE = 10_000_000;
const MAX_STOCK = 100_000;

function back(path: string, key: string, value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

// ---------- Products ----------

type ProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl: string;
};

async function readProduct(formData: FormData, returnPath: string): Promise<ProductInput> {
  const name = str(formData.get("name"), 80);
  const description = str(formData.get("description"), 500);
  const categoryId = str(formData.get("categoryId"), 40);
  const price = parseIntStrict(formData.get("price"), 1, MAX_PRICE);
  const stock = parseIntStrict(formData.get("stock"), 0, MAX_STOCK);
  let imageUrl = str(formData.get("imageUrl"), 500);

  if (!name) back(returnPath, "error", "Product name is required.");
  if (!description) back(returnPath, "error", "Description is required.");
  if (price === null) back(returnPath, "error", `Price must be a whole number of IDR between 1 and ${MAX_PRICE.toLocaleString("en-US")}.`);
  if (stock === null) back(returnPath, "error", `Stock must be a whole number between 0 and ${MAX_STOCK.toLocaleString("en-US")}.`);

  const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null;
  if (!category) back(returnPath, "error", "Please choose a category.");

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if (!saved.ok) back(returnPath, "error", saved.error);
    imageUrl = saved.url;
  }
  if (!imageUrl) back(returnPath, "error", "Provide an image URL or upload an image.");
  if (!isValidImageUrl(imageUrl)) back(returnPath, "error", "Image URL must start with http:// or https://.");

  return { name, description, price: price!, stock: stock!, categoryId, imageUrl };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const data = await readProduct(formData, "/admin/products");
  await prisma.product.create({ data });
  revalidateCatalog();
  back("/admin/products", "notice", "Product added.");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const data = await readProduct(formData, "/admin/products");
  try {
    await prisma.product.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      back("/admin/products", "error", "That product no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  back("/admin/products", "notice", "Product updated.");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  try {
    await prisma.product.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        back(
          "/admin/products",
          "error",
          "This product appears in past orders and cannot be deleted. Set its stock to 0 instead."
        );
      }
      if (e.code === "P2025") back("/admin/products", "error", "That product no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  back("/admin/products", "notice", "Product deleted.");
}

// ---------- Categories ----------

async function readCategory(formData: FormData) {
  const name = str(formData.get("name"), 40);
  const slug = slugify(name);
  if (!name || !slug) back("/admin/categories", "error", "Category name is required.");
  return { name, slug };
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const data = await readCategory(formData);
  try {
    await prisma.category.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      back("/admin/categories", "error", "A category with that name already exists.");
    }
    throw e;
  }
  revalidateCatalog();
  back("/admin/categories", "notice", "Category added.");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const data = await readCategory(formData);
  try {
    await prisma.category.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") back("/admin/categories", "error", "A category with that name already exists.");
      if (e.code === "P2025") back("/admin/categories", "error", "That category no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  back("/admin/categories", "notice", "Category updated.");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"), 40);
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    back(
      "/admin/categories",
      "error",
      `This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`
    );
  }
  try {
    await prisma.category.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") back("/admin/categories", "error", "This category is still in use.");
      if (e.code === "P2025") back("/admin/categories", "error", "That category no longer exists.");
    }
    throw e;
  }
  revalidateCatalog();
  back("/admin/categories", "notice", "Category deleted.");
}
