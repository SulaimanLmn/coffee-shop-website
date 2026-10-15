"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FLASH_PARAMS, flashMessage } from "@/lib/flash";
import { toast } from "@/lib/toast";

/**
 * Turns `?notice=` / `?saved=` into a toast, then strips the param so a reload
 * does not repeat it. Success feedback is then visible wherever the user is.
 */
export function FlashToast() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const hits = FLASH_PARAMS.filter((k) => params.get(k));
    if (hits.length === 0) return;
    for (const k of hits) toast(flashMessage(k, params.get(k)!));
    const next = new URLSearchParams(params.toString());
    for (const k of hits) next.delete(k);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
