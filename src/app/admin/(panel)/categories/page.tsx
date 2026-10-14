import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/confirm-button";
import {
  Field,
  Notice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-kit";

export const metadata: Metadata = { title: "Category management" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const editing = sp.edit ? categories.find((c) => c.id === sp.edit) : undefined;

  return (
    <div className="grid max-w-2xl gap-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-espresso">Categories</h1>
      {sp.notice && <Notice kind="success">{sp.notice}</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <section className="overflow-hidden rounded-2xl border border-latte bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Products</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-latte">
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-mocha">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-espresso">{c.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-mocha">{c._count.products}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/categories?edit=${c.id}`}
                      className="font-medium text-caramel-dark hover:text-espresso"
                    >
                      Edit
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton
                        message={`Delete the ${c.name} category?`}
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

      <section className="rounded-2xl border border-latte bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">
          {editing ? `Rename ${editing.name}` : "Add category"}
        </h2>
        <form
          key={editing?.id ?? "new"}
          action={editing ? updateCategoryAction : createCategoryAction}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Category name">
            <input name="name" required maxLength={40} defaultValue={editing?.name} className={inputClass} />
          </Field>
          <button type="submit" className={primaryButtonClass}>
            {editing ? "Save" : "Add"}
          </button>
          {editing && (
            <Link href="/admin/categories" className={secondaryButtonClass}>
              Cancel
            </Link>
          )}
        </form>
      </section>
    </div>
  );
}
