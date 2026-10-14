import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import {
  Field,
  Notice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Product management" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "asc" }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const editing = sp.edit ? products.find((p) => p.id === sp.edit) : undefined;

  return (
    <div className="grid gap-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">Products</h1>
      {sp.notice && <Notice kind="success">{sp.notice}</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <section className="overflow-x-auto rounded-2xl border border-latte bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-latte">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg bg-foam object-cover" />
                    <span className="font-medium text-espresso">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-mocha">{p.category.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(p.price)}</td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${p.stock <= 5 ? "font-semibold text-amber-700" : ""}`}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products?edit=${p.id}#product-form`}
                      className="font-medium text-caramel-dark hover:text-espresso"
                    >
                      Edit
                    </Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton
                        message={`Delete ${p.name}? This cannot be undone.`}
                        className="font-medium text-red-700 hover:text-red-900"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="product-form" className="scroll-mt-24 rounded-2xl border border-latte bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          {editing ? `Edit ${editing.name}` : "Add new product"}
        </h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-mocha">
            Create a category first on the{" "}
            <Link href="/admin/categories" className="font-medium text-caramel-dark">
              Categories
            </Link>{" "}
            page.
          </p>
        ) : (
          <form
            key={editing?.id ?? "new"}
            action={editing ? updateProductAction : createProductAction}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Name">
              <input name="name" required maxLength={80} defaultValue={editing?.name} className={inputClass} />
            </Field>
            <Field label="Category">
              <select
                name="categoryId"
                required
                defaultValue={editing?.categoryId ?? ""}
                className={inputClass}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  rows={3}
                  defaultValue={editing?.description}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Price (IDR)" hint="Whole rupiah, e.g. 28000.">
              <input
                name="price"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                defaultValue={editing?.price}
                className={inputClass}
              />
            </Field>
            <Field label="Stock">
              <input
                name="stock"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                defaultValue={editing?.stock ?? 0}
                className={inputClass}
              />
            </Field>
            <Field label="Image URL" hint="Or upload a file below (the upload takes priority).">
              <input
                name="imageUrl"
                type="text"
                maxLength={500}
                defaultValue={editing?.imageUrl}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
            <Field label="Upload image" hint="PNG, JPEG or WebP, up to 2 MB.">
              <input
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="text-sm text-mocha"
              />
            </Field>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className={primaryButtonClass}>
                {editing ? "Save changes" : "Add product"}
              </button>
              {editing && (
                <Link href="/admin/products" className={secondaryButtonClass}>
                  Cancel
                </Link>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
