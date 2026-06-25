"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-xs" role="search">
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search coffee…"
        aria-label="Search products"
        className="w-full rounded-full border border-latte bg-white px-4 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel"
      />
    </form>
  );
}
