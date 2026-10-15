/**
 * Only allow same-site absolute paths (optionally restricted to a prefix) so a
 * hidden `return` field cannot be turned into an open redirect.
 */
export function safeReturn(
  value: FormDataEntryValue | null,
  fallback: string,
  prefix?: string
): string {
  const v = typeof value === "string" ? value : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  if (prefix) {
    const path = v.split(/[?#]/)[0];
    if (path !== prefix && !path.startsWith(prefix + "/")) return fallback;
  }
  return v;
}

/** Set (or append) a query param on a path, keeping any `#hash` at the end. */
export function withParam(url: string, key: string, value: string): string {
  const [path, hash = ""] = url.split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}
