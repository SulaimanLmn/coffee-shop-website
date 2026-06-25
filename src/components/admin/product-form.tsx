import {
  createProductAction,
  updateProductAction,
} from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/catalog";

type Props = {
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    category: string;
  };
};

const inputClass =
  "w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel";

export function ProductForm({ product }: Props) {
  const action = product ? updateProductAction : createProductAction;

  return (
    <form action={action} className="grid gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Name</span>
        <input
          name="name"
          defaultValue={product?.name ?? ""}
          required
          maxLength={80}
          placeholder="Caffè Latte"
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Description</span>
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          required
          maxLength={280}
          rows={3}
          placeholder="Smooth espresso over steamed milk with a velvety finish."
          className={`${inputClass} resize-none leading-relaxed`}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Image URL</span>
        <input
          name="imageUrl"
          type="url"
          defaultValue={product?.imageUrl ?? ""}
          required
          placeholder="https://images.unsplash.com/…"
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Category</span>
        <select
          name="category"
          defaultValue={product?.category ?? "hot-coffee"}
          className={inputClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">
            Price (USD)
          </span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product ? (product.price / 100).toFixed(2) : ""}
            required
            placeholder="4.75"
            className={`${inputClass} tabular-nums`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">Stock</span>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
            placeholder="200"
            className={`${inputClass} tabular-nums`}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-full bg-caramel px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
      >
        {product ? "Save changes" : "Add to menu"}
      </button>
    </form>
  );
}
