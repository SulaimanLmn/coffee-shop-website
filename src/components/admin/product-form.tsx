import Link from "next/link";
import type { Category, Product } from "@prisma/client";
import { createProductAction, updateProductAction } from "@/lib/actions/admin";
import { Notice, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form-kit";
import { SubmitButton } from "@/components/submit-button";
import { ImagePreview } from "./image-preview";
import { PriceInput } from "./price-input";

export function ProductForm({
  product,
  categories,
  listHref,
  retryHref,
  closeHref,
  error,
  errorField,
}: {
  product?: Product;
  categories: Category[];
  /** Where to land after saving (the filtered list). */
  listHref: string;
  /** Where to land if validation fails (the drawer again). */
  retryHref: string;
  closeHref: string;
  error?: string;
  errorField?: string;
}) {
  const bad = (field: string) => (error && errorField === field ? true : undefined);
  const describe = (field: string) => (bad(field) ? "product-form-error" : undefined);

  return (
    <form action={product ? updateProductAction : createProductAction} className="grid gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="return" value={listHref} />
      <input type="hidden" name="retry" value={retryHref} />

      {error && (
        <div id="product-form-error">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Name</span>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={product?.name}
          aria-invalid={bad("name")}
          aria-describedby={describe("name")}
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Category</span>
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? ""}
          aria-invalid={bad("categoryId")}
          aria-describedby={describe("categoryId")}
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
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Description</span>
        <textarea
          name="description"
          required
          maxLength={500}
          rows={3}
          defaultValue={product?.description}
          aria-invalid={bad("description")}
          aria-describedby={describe("description")}
          className={inputClass}
        />
      </label>

      <PriceInput
        defaultValue={product?.price}
        invalid={bad("price")}
        describedBy={describe("price")}
      />

      <ImagePreview
        initialUrl={product?.imageUrl}
        invalid={bad("imageUrl") ?? bad("image")}
        describedBy={describe("imageUrl") ?? describe("image")}
      />

      <label className="flex items-start gap-3 rounded-xl border border-latte bg-foam/60 px-4 py-3">
        <input
          type="checkbox"
          name="isAvailable"
          defaultChecked={product?.isAvailable ?? true}
          className="mt-0.5 h-4 w-4 accent-caramel-dark"
        />
        <span>
          <span className="block text-sm font-medium text-espresso">Available to order</span>
          <span className="block text-xs text-mocha">
            Switch off when it is sold out for the day. Customers see it as unavailable.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-latte bg-foam/60 px-4 py-3">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={product?.isFeatured ?? false}
          className="mt-0.5 h-4 w-4 accent-caramel-dark"
        />
        <span>
          <span className="block text-sm font-medium text-espresso">Feature on the home page</span>
          <span className="block text-xs text-mocha">
            Shown in the promotional banner at the top of the menu (up to 3 products).
          </span>
        </span>
      </label>

      <div className="sticky bottom-0 -mx-6 -mb-5 flex gap-3 border-t border-latte bg-white px-6 py-4">
        <SubmitButton pendingLabel="Saving…" className={primaryButtonClass}>
          {product ? "Save Changes" : "Add to Menu"}
        </SubmitButton>
        <Link href={closeHref} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
