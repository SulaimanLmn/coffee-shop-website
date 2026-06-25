"use client";

import { cancelOrderAction } from "@/app/admin/actions";

export function CancelOrderButton({ id }: { id: string }) {
  return (
    <form
      action={cancelOrderAction}
      onSubmit={(e) => {
        if (!confirm("Cancel this order and restore stock?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Cancel order
      </button>
    </form>
  );
}
