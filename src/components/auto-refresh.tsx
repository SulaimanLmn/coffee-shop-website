"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * Re-fetches the server components every `seconds` while the tab is visible and
 * nobody is typing in a field. With `watchCount`, announces when the value rises
 * (the toaster is an aria-live region, so screen readers hear it too).
 */
export function AutoRefresh({
  seconds,
  watchCount,
  watchLabel = "new orders",
}: {
  seconds: number;
  watchCount?: number;
  /** Plural noun phrase; "new orders" becomes "1 new order" for a single item. */
  watchLabel?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const active = document.activeElement;
      if (active && FIELD.test(active.tagName)) return;
      startTransition(() => router.refresh());
      setUpdatedAt(timeFormat.format(new Date()));
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  useEffect(() => {
    if (watchCount === undefined) return;
    const before = previous.current;
    previous.current = watchCount;
    if (before !== null && watchCount > before) {
      const n = watchCount - before;
      toast(`${n} ${n === 1 ? watchLabel.replace(/s$/, "") : watchLabel}`, "info");
    }
  }, [watchCount, watchLabel]);

  return (
    <p className="text-xs text-mocha">
      Updates every {seconds}s{updatedAt ? ` · last checked ${updatedAt}` : ""}
    </p>
  );
}
