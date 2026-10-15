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
import { CategoryNameInput } from "@/components/admin/category-name-input";
import { Notice, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form-kit";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Category management" };
export const dynamic = "force-dynamic";

const LIST = "/admin/categories";

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

  return (
    <div className="grid max-w-3xl gap-5">
      <PageHeader title="Categories" description="Group the menu. Customers filter by these." />
      {sp.error && !sp.edit && <Notice kind="error">{sp.error}</Notice>}

      <section className="overflow-hidden rounded-2xl border border-latte bg-white">
        <form
          action={createCategoryAction}
          className="flex flex-wrap items-end gap-3 border-b border-latte p-4"
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-espresso">Add a Category</span>
            <input name="name" required maxLength={40} placeholder="e.g. Seasonal" className={`${inputClass} w-64`} />
          </label>
          <SubmitButton pendingLabel="Adding…" className={primaryButtonClass}>
            Add to Category
          </SubmitButton>
        </form>

        {categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-mocha">
            No categories yet. Add the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">Menu categories and how many products each holds</caption>
              <thead className="border-b border-latte bg-foam text-xs uppercase tracking-[0.08em] text-mocha">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Products</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-latte">
                {categories.map((c) => {
                  const inUse = c._count.products > 0;
                  if (sp.edit === c.id) {
                    return (
                      <tr key={c.id} id={`category-${c.id}`} className="scroll-mt-24 bg-foam/50">
                        <td colSpan={3} className="px-4 py-2.5">
                          <form action={updateCategoryAction} className="flex flex-wrap items-center gap-3">
                            <input type="hidden" name="id" value={c.id} />
                            <CategoryNameInput
                              name="name"
                              defaultValue={c.name}
                              cancelHref={LIST}
                              label={`New name for ${c.name}`}
                              invalid={!!sp.error}
                              describedBy={sp.error ? "rename-error" : undefined}
                            />
                            <SubmitButton pendingLabel="Saving…" className={primaryButtonClass}>
                              Save
                            </SubmitButton>
                            <Link href={LIST} className={secondaryButtonClass}>
                              Cancel
                            </Link>
                            {sp.error && (
                              <p id="rename-error" role="alert" className="w-full text-sm text-red-700">
                                {sp.error}
                              </p>
                            )}
                          </form>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={c.id} id={`category-${c.id}`} className="scroll-mt-24 hover:bg-foam/50">
                      <td className="px-4 py-2.5 font-medium text-espresso">{c.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {inUse ? (
                          <Link
                            href={`/admin/products?category=${c.slug}`}
                            className="font-medium text-caramel-dark underline-offset-2 hover:underline"
                          >
                            {c._count.products}
                            <span className="sr-only"> products in {c.name}</span>
                          </Link>
                        ) : (
                          <span className="text-mocha">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-start justify-end gap-4">
                          <Link
                            href={`${LIST}?edit=${c.id}`}
                            className="font-medium text-caramel-dark underline-offset-2 hover:underline"
                          >
                            Edit<span className="sr-only"> {c.name}</span>
                          </Link>
                          <form action={deleteCategoryAction} className="text-right">
                            <input type="hidden" name="id" value={c.id} />
                            {inUse ? (
                              <>
                                <button
                                  type="button"
                                  disabled
                                  aria-describedby={`keep-${c.id}`}
                                  className="cursor-not-allowed font-medium text-mocha/60"
                                >
                                  Delete<span className="sr-only"> {c.name}</span>
                                </button>
                                <p id={`keep-${c.id}`} className="mt-0.5 max-w-44 text-xs text-mocha">
                                  Has products. Move or delete them first.
                                </p>
                              </>
                            ) : (
                              <ConfirmButton
                                message={`Delete the ${c.name} category?`}
                                className="font-medium text-red-700 underline-offset-2 hover:underline"
                              >
                                Delete<span className="sr-only"> {c.name}</span>
                              </ConfirmButton>
                            )}
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
      </section>
    </div>
  );
}
