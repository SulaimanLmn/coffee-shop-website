"use client";

import { useEffect } from "react";

/** Neutral coffee-cup placeholder in the theme colours (foam background, caramel line). */
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160' width='160' height='160'>" +
      "<rect width='160' height='160' fill='#f3ece2'/>" +
      "<g fill='none' stroke='#b87333' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M46 66h56v30a24 24 0 0 1-24 24h-8a24 24 0 0 1-24-24z'/>" +
      "<path d='M102 74h8a12 12 0 0 1 0 24h-8'/>" +
      "<path d='M62 40c0 6 6 6 6 12M80 40c0 6 6 6 6 12'/></g></svg>"
  );

function swap(img: HTMLImageElement) {
  if (img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.removeAttribute("srcset");
  img.src = PLACEHOLDER;
}

/**
 * Site-wide: any <img> that fails to load (e.g. an external image link that has gone
 * away) shows the placeholder instead of the browser's broken-image icon. Error events
 * do not bubble, so they are caught in the capture phase; images that failed before
 * hydration are found on mount.
 */
export function ImageFallback() {
  useEffect(() => {
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) swap(e.target);
    };
    document.addEventListener("error", onError, true);
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap(img);
    });
    return () => document.removeEventListener("error", onError, true);
  }, []);
  return null;
}
