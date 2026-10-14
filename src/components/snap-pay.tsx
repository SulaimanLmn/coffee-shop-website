"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const SNAP_SRC = "https://app.sandbox.midtrans.com/snap/snap.js";

function loadSnap(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.snap) return Promise.resolve();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  if (!clientKey) return Promise.reject(new Error("Payment is not configured."));

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SNAP_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load the payment window.")));
    if (!existing) {
      script.src = SNAP_SRC;
      script.setAttribute("data-client-key", clientKey);
      document.head.appendChild(script);
    }
  });
}

/** Opens the Midtrans Snap popup and routes to the payment result page when it ends. */
export function useSnapPay() {
  const router = useRouter();

  return useCallback(
    async (token: string, orderId: string) => {
      await loadSnap();
      const done = () => router.push(`/payment/result?order_id=${encodeURIComponent(orderId)}`);
      window.snap!.pay(token, {
        onSuccess: done,
        onPending: done,
        onError: done,
        onClose: done,
      });
    },
    [router]
  );
}

/** Button that fetches the stored Snap token for an unpaid order and opens Snap. */
export function PayButton({
  orderId,
  label = "Pay now",
  className,
  fallbackHref = "/cart",
}: {
  orderId: string;
  label?: string;
  className?: string;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const pay = useSnapPay();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/snap`, { method: "POST" });
      const data = await res.json();
      if (res.status === 409) {
        // Order can no longer be paid (expired/cancelled): refresh state or go back to the cart.
        router.push(fallbackHref);
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Unable to start payment.");
      await pay(data.token, data.orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={onClick} disabled={busy} className={className}>
        {busy ? "Opening payment…" : label}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
