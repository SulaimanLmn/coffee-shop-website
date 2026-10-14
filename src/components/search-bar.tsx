"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) next.set("q", trimmed);
    // Keep an active category/sort when searching from the menu page.
    const category = params.get("category");
    const sort = params.get("sort");
    if (category) next.set("category", category);
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(`/${qs ? `?${qs}` : ""}#menu`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xs" role="search">
      <input
        type="search"
        name="q"
        value={q}
        maxLength={100}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the menu…"
        aria-label="Search products by name"
        className="w-full rounded-full border border-latte bg-white px-4 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
      />
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense fallback={null}>
      <SearchForm />
    </Suspense>
  );
}
