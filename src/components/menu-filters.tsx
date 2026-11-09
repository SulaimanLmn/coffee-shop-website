"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  q: string;
  category: string;
  sort: string;
  sortOptions: readonly { value: string; label: string }[];
};

// Search and sort apply on every change; the Apply button only shows without JS.
export function MenuFilters({ q: initialQ, category, sort, sortOptions }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function go(nextQ: string, nextSort: string) {
    const qs = new URLSearchParams();
    const trimmed = nextQ.trim();
    if (trimmed) qs.set("q", trimmed);
    if (category) qs.set("category", category);
    if (nextSort !== "menu") qs.set("sort", nextSort);
    const s = qs.toString();
    router.replace(`/${s ? `?${s}` : ""}#menu`, { scroll: false });
  }

  return (
    <form
      method="get"
      action="/"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(q, sort);
      }}
      className="mt-4 flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="category" value={category} />
      <label className="grid gap-1 text-xs font-medium text-mocha">
        Search
        <input
          name="q"
          type="search"
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            go(e.target.value, sort);
          }}
          placeholder="Search by name"
          className="w-56 rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-mocha">
        Sort by
        <select
          name="sort"
          value={sort}
          onChange={(e) => go(q, e.target.value)}
          className="rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none focus:border-caramel"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button
          type="submit"
          className="rounded-full bg-caramel-dark px-5 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </noscript>
    </form>
  );
}
