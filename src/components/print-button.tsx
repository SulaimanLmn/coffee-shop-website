"use client";

import { primaryButtonClass } from "./form-kit";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={primaryButtonClass}>
      Print / Save as PDF
    </button>
  );
}
