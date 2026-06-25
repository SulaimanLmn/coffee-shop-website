"use client";

import { useToastStore } from "@/lib/toast";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={
            "pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all " +
            (t.variant === "error"
              ? "bg-red-600 text-white"
              : t.variant === "info"
                ? "bg-espresso text-cream"
                : "bg-espresso text-cream")
          }
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
