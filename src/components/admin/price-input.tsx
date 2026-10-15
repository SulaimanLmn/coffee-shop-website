"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { inputClass } from "@/components/form-kit";

/** Whole-rupiah price input with a formatted hint ("Rp 28.000") under it. */
export function PriceInput({
  defaultValue,
  invalid,
  describedBy,
}: {
  defaultValue?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [value, setValue] = useState(defaultValue === undefined ? "" : String(defaultValue));
  const amount = /^\d+$/.test(value) ? Number(value) : null;

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-espresso">Price (IDR)</span>
      <input
        name="price"
        inputMode="numeric"
        pattern="[0-9]*"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={`price-hint${describedBy ? ` ${describedBy}` : ""}`}
        className={inputClass}
      />
      <span id="price-hint" className="text-xs text-mocha">
        Whole rupiah, no dots.{amount !== null && amount > 0 ? ` = ${formatPrice(amount)}` : ""}
      </span>
    </label>
  );
}
