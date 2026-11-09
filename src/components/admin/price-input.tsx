"use client";

import { useState } from "react";
import { inputClass } from "@/components/form-kit";

/** Whole-rupiah price input, displayed with thousands dots ("28.000"). */
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
  // Display-only thousands separators; the submitted value stays plain digits.
  const display = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-espresso">Price (IDR)</span>
      <input type="hidden" name="price" value={value} />
      <input
        inputMode="numeric"
        autoComplete="off"
        required
        value={display}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
    </label>
  );
}
