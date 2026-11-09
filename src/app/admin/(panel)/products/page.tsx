import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { buildProductWhere } from "@/lib/catalog";
import { parseProductsView, productsHref } from "@/lib/admin-products";
import { deleteProductAction, toggleAvailabilityAction } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import { AvailabilitySwitch } from "@/components/admin/availability-switch";
import { ProductForm } from "@/components/admin/product-form";
import { LiveSearch } from "@/components/admin/live-search";
import { Notice, primaryButtonClass } from "@/components/form-kit";
import { PageHeader } from "@/components/page-header";
import { RouteDialog } from "@/components/route-dialog";

export const metadata: Metadata = { title: "Product management" };
export const dynamic = "force-dynamic";

const AVAIL_CHOICES = [
  { value: null, label: "All" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const view = parseProductsView(sp);
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const errorField = typeof sp.field === "string" ? sp.field : undefined;

  const [products, categories, editing] = await Promise.all([
    prisma.product.findMany({
      where: buildProductWhere({ q: view.q, category: view.category, availability: view.avail }),
      orderBy: { createdAt: "asc" },
      include: { category: true, _count: { select: { orderItems: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    view.edit ? prisma.product.findUnique({ where: { id: view.edit } }) : Promise.resolve(null),
  ]);

  const listHref = productsHref({ ...view, edit: null, isNew: false });
  const drawerOpen = view.isNew || !!view.edit;
  const filtered = !!(view.q || view.category || view.avail);
  const chip = (active: boolean) =>
    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
    (active
      ? "border-espresso bg-espresso text-cream"
      : "border-latte bg-white text-espresso hover:border-caramel");

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Products"
        actions={
          <Link
            href={productsHref({ ...view, edit: null, isNew: true })}
            id="add-product"
            className={primaryButtonClass}
          >
            Add a Product
          </Link>
        }
      />

      {error && !drawerOpen && <Notice kind="error">{error}</Notice>}

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <LiveSearch
            action="/admin/products"
            id="product-search"
            label="Search products by name"
            placeholder="Search by name"
            q={view.q}
            keep={{ category: view.category, avail: view.avail }}
            className="w-64"
          />
          {filtered && (
            <Link href="/admin/products" className="text-sm font-medium text-mocha hover:text-espresso">
              Clear filters
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
            <Link
              href={productsHref({ ...view, category: "", edit: null, isNew: false })}
              aria-current={view.category === "" ? "page" : undefined}
              className={chip(view.category === "")}
            >
              All categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={productsHref({ ...view, category: c.slug, edit: null, isNew: false })}
                aria-current={view.category === c.slug ? "page" : undefined}
                className={chip(view.category === c.slug)}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Filter by availability" className="flex gap-2">
            {AVAIL_CHOICES.map((a) => (
              <Link
                key={a.label}
                href={productsHref({ ...view, avail: a.value, edit: null, isNew: false })}
                aria-current={view.avail === a.value ? "page" : undefined}
                className={chip(view.avail === a.value)}
              >
                {a.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-latte bg-white p-10 text-center text-mocha">
          <p>{filtered ? "No products match." : "No products yet."}</p>
          {filtered && (
            <Link href="/admin/products" className="mt-2 inline-block text-sm font-medium text-caramel-dark">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-latte bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">
              Menu products ({products.length}). Use the switch to mark a product available or unavailable.
            </caption>
            <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Available</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {products.map((p) => {
                const inOrders = p._count.orderItems > 0;
                return (
                  <tr key={p.id} id={`product-${p.id}`} className="scroll-mt-24 hover:bg-foam/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg bg-foam object-cover" />
                        <span className="font-medium text-espresso">{p.name}</span>
                        {p.isFeatured && (
                          <span className="rounded-full bg-foam px-2 py-0.5 text-xs font-medium text-mocha">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-mocha">{p.category.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-4 py-2.5">
                      <form action={toggleAvailabilityAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="next" value={p.isAvailable ? "0" : "1"} />
                        <input type="hidden" name="return" value={listHref} />
                        <AvailabilitySwitch name={p.name} checked={p.isAvailable} />
                      </form>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-start justify-end gap-4">
                        <Link
                          id={`edit-${p.id}`}
                          href={productsHref({ ...view, isNew: false, edit: p.id })}
                          className="font-medium text-caramel-dark underline-offset-2 hover:underline"
                        >
                          Edit<span className="sr-only"> {p.name}</span>
                        </Link>
                        <form action={deleteProductAction} className="text-right">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="return" value={listHref} />
                          <ConfirmButton
                            message={
                              inOrders
                                ? `Delete ${p.name}? It will be removed from the menu. Past orders keep its name and price.`
                                : `Delete ${p.name}? This cannot be undone.`
                            }
                            className="font-medium text-red-700 underline-offset-2 hover:underline"
                          >
                            Delete<span className="sr-only"> {p.name}</span>
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawerOpen && (
        <RouteDialog
          key={view.edit ?? "new"}
          variant="side"
          title={view.isNew ? "Add a Product" : editing ? `Edit ${editing.name}` : "Product not found"}
          closeHref={listHref}
          returnFocusId={view.edit ? `edit-${view.edit}` : "add-product"}
        >
          {categories.length === 0 ? (
            <p className="text-sm text-mocha">
              Create a category first on the{" "}
              <Link href="/admin/categories" className="font-medium text-caramel-dark">
                Category
              </Link>{" "}
              page.
            </p>
          ) : view.isNew || editing ? (
            <ProductForm
              product={view.isNew ? undefined : (editing ?? undefined)}
              categories={categories}
              listHref={listHref}
              retryHref={productsHref({ ...view })}
              closeHref={listHref}
              error={error}
              errorField={errorField}
            />
          ) : (
            <p className="text-sm text-mocha">That product no longer exists.</p>
          )}
        </RouteDialog>
      )}
    </div>
  );
}
