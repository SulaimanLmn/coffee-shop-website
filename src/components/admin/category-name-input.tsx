"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/form-kit";

/** Inline rename field. Escape cancels (the Cancel link does the same without JS). */
export function CategoryNameInput({
  name,
  defaultValue,
  cancelHref,
  label,
  invalid,
  describedBy,
}: {
  name: string;
  defaultValue: string;
  cancelHref: string;
  label: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const router = useRouter();
  return (
    <input
      name={name}
      required
      maxLength={40}
      defaultValue={defaultValue}
      // The row was just opened by the admin, so moving focus here is expected.
      autoFocus
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onKeyDown={(e) => {
        if (e.key === "Escape") router.replace(cancelHref, { scroll: false });
      }}
      className={`${inputClass} max-w-xs`}
    />
  );
}
