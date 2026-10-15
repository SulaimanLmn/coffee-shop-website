import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SORT_OPTIONS = [
  { value: "menu", label: "Menu order" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export type BrowseParams = { q: string; category: string; sort: SortValue };

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function parseBrowseParams(sp: RawParams): BrowseParams {
  const sort = first(sp.sort);
  return {
    q: first(sp.q).trim().slice(0, 100),
    category: first(sp.category).trim().slice(0, 60),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortValue) : "menu",
  };
}

export function orderByFor(sort: SortValue): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "name-asc":
      return [{ name: "asc" }];
    case "name-desc":
      return [{ name: "desc" }];
    case "price-asc":
      return [{ price: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { name: "asc" }];
    default:
      return [{ createdAt: "asc" }, { name: "asc" }];
  }
}

export function buildProductWhere(
  p: Pick<BrowseParams, "q" | "category"> & { onlyAvailable?: boolean }
): Prisma.ProductWhereInput {
  return {
    ...(p.onlyAvailable ? { isAvailable: true } : {}),
    ...(p.q ? { name: { contains: p.q, mode: "insensitive" } } : {}),
    ...(p.category ? { category: { slug: p.category } } : {}),
  };
}

export async function listProducts(p: BrowseParams) {
  return prisma.product.findMany({
    where: buildProductWhere(p),
    orderBy: orderByFor(p.sort),
    include: { category: true },
  });
}

export type Availability = "available" | "unavailable";

export function availability(isAvailable: boolean): Availability {
  return isAvailable ? "available" : "unavailable";
}

export function availabilityLabel(isAvailable: boolean): string {
  return isAvailable ? "Available" : "Unavailable";
}
