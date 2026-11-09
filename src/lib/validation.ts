export function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().toLowerCase();
  return t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
}

export function str(value: FormDataEntryValue | null, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 128) return "Password is too long.";
  return null;
}

/** Indonesian-friendly phone: digits, optional leading +, 8-15 digits. */
export function normalizePhone(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const t = value.replace(/[\s-]/g, "");
  return /^\+?\d{8,15}$/.test(t) ? t : null;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** http(s) URL, a locally uploaded file path, or one of the bundled menu photos. */
export function isValidImageUrl(url: string): boolean {
  if (/^\/api\/uploads\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(url)) return true;
  if (/^\/menu\/[a-z0-9-]{1,60}\.(png|jpg|webp)$/.test(url)) return true;
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && url.length <= 500;
  } catch {
    return false;
  }
}

export function parseIntStrict(
  value: FormDataEntryValue | null,
  min: number,
  max: number
): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= min && n <= max ? n : null;
}
