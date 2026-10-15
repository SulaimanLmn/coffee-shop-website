"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "bh-admin-sidebar-collapsed";
const EVENT = "bh-admin-sidebar";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function toggleCollapsed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, readCollapsed() ? "0" : "1");
  } catch {
    // Storage blocked: the sidebar just stays expanded.
  }
  window.dispatchEvent(new Event(EVENT));
}

const icon = (d: string) => (
  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ITEMS: { href: string; label: string; exact?: boolean; icon: ReactNode; badge?: "orders" }[] = [
  { href: "/admin", label: "Dashboard", exact: true, icon: icon("M3 11l7-7 7 7M5 9.5V16h4v-4h2v4h4V9.5") },
  { href: "/admin/orders", label: "Order Management", icon: icon("M5 3h10v14H5zM8 7h4M8 10h4M8 13h2"), badge: "orders" },
  { href: "/admin/products", label: "Product", icon: icon("M3 7l7-4 7 4v6l-7 4-7-4zM3 7l7 4 7-4M10 11v6") },
  { href: "/admin/categories", label: "Category", icon: icon("M3 4h6v6H3zM11 4h6v6h-6zM3 12h6v4H3zM11 12h6v4h-6z") },
];

export function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  return (
    <aside className={`md:sticky md:top-20 md:h-fit ${collapsed ? "md:w-14" : "md:w-56"}`}>
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const showBadge = item.badge === "orders" && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={
                "relative flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                (active ? "bg-foam text-espresso" : "text-mocha hover:bg-foam/70 hover:text-espresso")
              }
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-caramel-dark md:inset-x-auto md:bottom-2 md:left-0 md:top-2 md:h-auto md:w-1"
                />
              )}
              {item.icon}
              <span className={collapsed ? "md:sr-only" : ""}>{item.label}</span>
              {showBadge && (
                <span
                  className={
                    "ml-auto rounded-full bg-caramel-dark px-2 py-0.5 text-xs font-semibold tabular-nums text-white " +
                    (collapsed ? "md:absolute md:right-0.5 md:top-0.5 md:ml-0 md:px-1.5 md:py-0 md:text-[10px]" : "")
                  }
                >
                  {pendingCount}
                  <span className="sr-only"> orders waiting</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-pressed={collapsed}
        className="mt-3 hidden items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-mocha transition-colors hover:bg-foam/70 hover:text-espresso md:flex"
      >
        <svg viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={collapsed ? "sr-only" : ""}>{collapsed ? "Expand menu" : "Collapse menu"}</span>
      </button>
    </aside>
  );
}
