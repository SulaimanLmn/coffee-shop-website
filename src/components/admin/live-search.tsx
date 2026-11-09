"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, primaryButtonClass } from "@/components/form-kit";

type Props = {
  action: string;
  id: string;
  label: string;
  placeholder: string;
  q: string;
  // Other query params to keep while searching (filters, view). Empty values are skipped.
  keep?: Record<string, string | null | undefined>;
  maxLength?: number;
  className?: string;
};

// Applies the search as you type (debounced); the button only shows without JS.
export function LiveSearch({ action, id, label, placeholder, q: initialQ, keep = {}, maxLength = 100, className = "w-56" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function go(value: string) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(keep)) if (v) qs.set(k, v);
    const trimmed = value.trim();
    if (trimmed) qs.set("q", trimmed);
    const s = qs.toString();
    router.replace(`${action}${s ? `?${s}` : ""}`, { scroll: false });
  }

  return (
    <form
      method="get"
      action={action}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(q);
      }}
      className="flex items-center gap-2"
    >
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        value={q}
        maxLength={maxLength}
        onChange={(e) => {
          const value = e.target.value;
          setQ(value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => go(value), 250);
        }}
        placeholder={placeholder}
        className={`${inputClass} ${className}`}
      />
      <noscript>
        <button type="submit" className={primaryButtonClass}>
          Search
        </button>
      </noscript>
    </form>
  );
}
