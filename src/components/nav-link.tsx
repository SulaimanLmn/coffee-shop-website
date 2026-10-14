"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  exact,
  variant = "plain",
  children,
}: {
  href: string;
  exact?: boolean;
  variant?: "plain" | "cart";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href || (href === "/" && pathname.startsWith("/products/"))
    : pathname === href || pathname.startsWith(href + "/");

  const base =
    "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ";
  const style =
    variant === "cart"
      ? active
        ? "bg-espresso text-cream"
        : "border border-latte bg-white text-espresso hover:border-caramel"
      : active
        ? "bg-espresso text-cream"
        : "text-mocha hover:text-espresso";

  return (
    <Link href={href} className={base + style}>
      {children}
    </Link>
  );
}
