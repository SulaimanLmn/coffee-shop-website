"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SANDBOX_CARD, SANDBOX_SIMULATOR_URL } from "@/lib/sandbox-payment";
import { useSnapOpen } from "@/components/snap-pay";

/* Guides for finishing a Midtrans Sandbox (test) payment. People trying the demo have
   usually never seen Midtrans, so the steps are shown on the cart, beside the payment
   window while it is open, and on the "payment not completed" page. */

function CopyValue({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the value is still visible to type in.
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="min-w-0 text-mocha">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="whitespace-nowrap font-mono font-semibold tracking-wide text-espresso">{value}</span>
        {copy && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-latte bg-white px-2 py-0.5 text-[11px] font-semibold text-caramel-dark transition-colors hover:border-caramel"
          >
            {copied ? "Copied" : "Copy"}
            <span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        )}
      </dd>
    </div>
  );
}

/** The test card, with the number copyable. */
export function SandboxCardDetails() {
  return (
    <dl className="grid gap-1.5 rounded-lg border border-latte bg-white px-3 py-2.5 text-xs">
      <CopyValue label="Card number" value={SANDBOX_CARD.number} copy />
      <CopyValue label="Expiration date" value={SANDBOX_CARD.expiry} />
      <CopyValue label="CVV" value={SANDBOX_CARD.cvv} />
      <CopyValue label="OTP / 3D Secure" value={SANDBOX_CARD.otp} copy />
    </dl>
  );
}

/** Step-by-step instructions, shared by the tooltip and the floating panel. */
export function SandboxSteps() {
  return (
    <div className="grid gap-3 text-xs leading-relaxed text-espresso">
      <div>
        <p className="font-semibold">Pay with the test card (easiest)</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4">
          <li>
            In the Midtrans window, choose <strong>Card Payment</strong>.
          </li>
          <li>Enter the card number, expiration date and CVV below.</li>
          <li>
            Click <strong>Pay now</strong>.
          </li>
          <li>
            If a 3D Secure page asks for a password or OTP, type{" "}
            <strong className="font-mono">{SANDBOX_CARD.otp}</strong> and click <strong>OK</strong>.
          </li>
          <li>
            Wait for <strong>Payment successful</strong>. The shop then shows your payment result by
            itself.
          </li>
        </ol>
        <div className="mt-2">
          <SandboxCardDetails />
        </div>
      </div>
      <details className="rounded-lg bg-foam/70 px-3 py-2">
        <summary className="cursor-pointer font-semibold">Chose a bank transfer or QRIS instead?</summary>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4">
          <li>Copy the virtual account number (or the QR code link) that Midtrans shows.</li>
          <li>
            Open the{" "}
            <a
              href={SANDBOX_SIMULATOR_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-caramel-dark underline"
            >
              Midtrans payment simulator
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            , pick the same bank or method, paste it, then click <strong>Inquire</strong> and{" "}
            <strong>Pay</strong>.
          </li>
          <li>Come back to this tab. The order turns Paid within a few seconds; refresh if needed.</li>
        </ol>
      </details>
      <p className="text-mocha">
        This is the Midtrans <strong>Sandbox</strong>: no real money is charged. Closed the window by
        accident? Your order is saved; open <strong>Orders</strong> and press <strong>Pay now</strong>.
      </p>
    </div>
  );
}

/** "?" toggletip that reveals the full steps (click, or Enter/Space; Escape closes). */
export function SandboxHelpTip({ label = "How do I finish the test payment?" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-caramel-dark underline-offset-2 hover:underline"
      >
        <span
          aria-hidden="true"
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-caramel-dark text-[10px] font-bold text-white no-underline"
        >
          ?
        </span>
        {label}
      </button>
      {open && (
        <div
          id={id}
          role="region"
          aria-label="How to finish the Midtrans test payment"
          className="absolute bottom-full left-1/2 z-30 mb-2 max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-xl border border-latte bg-white p-4 text-left shadow-xl"
        >
          <SandboxSteps />
        </div>
      )}
    </span>
  );
}

/** Callout next to Checkout: test-mode warning, the card, and the "?" tooltip. */
export function SandboxPaymentNotice() {
  return (
    <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-caramel bg-foam/60 p-3 text-left">
      <p className="text-xs font-semibold text-espresso">
        Test mode: payments use the Midtrans Sandbox, so no real money is charged.
      </p>
      <p className="text-xs text-mocha">
        After Checkout, choose <strong>Card Payment</strong> and pay with this test card:
      </p>
      <SandboxCardDetails />
      <SandboxHelpTip />
    </div>
  );
}

const WIDE = "(min-width: 1120px)";

/**
 * Floating guide shown on top of the Midtrans Snap window while it is open. Snap covers
 * the page with a full-screen iframe, so the panel is portalled to the end of <body> with
 * the highest z-index and kept last, which keeps it above Snap.
 */
export function SnapGuidePanel() {
  const open = useSnapOpen();
  if (!open) return null;
  return createPortal(<FloatingGuide />, document.body);
}

function FloatingGuide() {
  // Wide screens have room beside the centred Midtrans window; small ones start collapsed.
  const [expanded, setExpanded] = useState(() => window.matchMedia(WIDE).matches);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const keepLast = new MutationObserver((records) => {
      const others = records.some((r) => Array.from(r.addedNodes).some((n) => n !== el));
      if (others && document.body.lastElementChild !== el) document.body.appendChild(el);
    });
    keepLast.observe(document.body, { childList: true });
    return () => keepLast.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      style={{ zIndex: 2147483647 }}
      className="fixed bottom-4 left-4 max-h-[calc(100vh-2rem)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-2 border-caramel bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-latte bg-foam px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-espresso">Test payment guide</p>
          <p className="text-[11px] text-mocha">Midtrans Sandbox · no real money</p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-full border border-latte bg-white px-2.5 py-1 text-[11px] font-semibold text-caramel-dark hover:border-caramel"
        >
          {expanded ? "Hide steps" : "Show steps"}
        </button>
      </div>
      {expanded && (
        <div className="px-4 py-3">
          <SandboxSteps />
        </div>
      )}
    </div>
  );
}
