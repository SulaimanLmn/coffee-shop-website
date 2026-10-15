import { parseAvailabilityFilter, type Availability } from "@/lib/catalog";

type RawParams = Record<string, string | string[] | undefined>;

export type ProductsView = {
  q: string;
  /** Category slug. */
  category: string;
  avail: Availability | null;
  /** Product id open in the edit drawer. */
  edit: string | null;
  /** Add-product drawer open. */
  isNew: boolean;
};

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function parseProductsView(sp: RawParams): ProductsView {
  return {
    q: first(sp.q).trim().slice(0, 100),
    category: first(sp.category).trim().slice(0, 60),
    avail: parseAvailabilityFilter(sp.avail),
    edit: first(sp.edit).slice(0, 40) || null,
    isNew: first(sp.new) === "1",
  };
}

/** Build a /admin/products URL, leaving out defaults. Filters survive opening a drawer. */
export function productsHref(next: Partial<ProductsView>): string {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.avail) params.set("avail", next.avail);
  if (next.edit) params.set("edit", next.edit);
  else if (next.isNew) params.set("new", "1");
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}
