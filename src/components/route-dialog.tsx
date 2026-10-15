"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * A native <dialog> opened with showModal() (focus trap + inert background).
 * It is driven by the URL: closing it (Escape, backdrop, or the X button)
 * navigates to `closeHref`, and focus returns to `returnFocusId`.
 */
export function RouteDialog({
  title,
  closeHref,
  returnFocusId,
  variant = "center",
  children,
}: {
  title: ReactNode;
  closeHref: string;
  returnFocusId?: string;
  variant?: "center" | "side";
  children: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (returnFocusId) {
        window.requestAnimationFrame(() => document.getElementById(returnFocusId)?.focus());
      }
    };
  }, [returnFocusId]);

  const shape =
    variant === "side"
      ? "route-dialog-side fixed inset-y-0 right-0 m-0 h-dvh max-h-none w-full max-w-lg rounded-l-2xl"
      : "route-dialog-center m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,42rem)] rounded-2xl";

  return (
    <>
      {/* Without JS nothing calls showModal(), so show the dialog inline instead. */}
      <noscript>
        <style>{`dialog.route-dialog:not([open]){display:block;position:static;margin:0 0 1rem;width:auto;max-width:none;height:auto;max-height:none;border-radius:1rem;animation:none}`}</style>
      </noscript>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => router.push(closeHref, { scroll: false })}
        onClick={(e) => {
          // Clicks on the backdrop land on the <dialog> element itself.
          if (e.target === ref.current) ref.current?.close();
        }}
        className={`route-dialog overflow-hidden border border-latte bg-white p-0 text-espresso shadow-xl ${shape}`}
      >
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-latte px-6 py-4">
            <h2 id={titleId} className="font-display text-xl font-semibold text-espresso">
              {title}
            </h2>
            <noscript>
              <a href={closeHref} className="text-sm font-medium text-caramel-dark">
                Close
              </a>
            </noscript>
            <button
              type="button"
              aria-label="Close"
              onClick={() => ref.current?.close()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mocha transition-colors hover:bg-foam hover:text-espresso"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}
