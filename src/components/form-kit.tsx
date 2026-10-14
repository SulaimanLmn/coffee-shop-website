import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-latte bg-white px-3 py-2 text-sm text-espresso outline-none transition-colors focus:border-caramel";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-caramel px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark disabled:cursor-not-allowed disabled:bg-latte disabled:text-mocha";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-latte bg-white px-5 py-2.5 text-sm font-semibold text-espresso transition-colors hover:border-caramel";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-espresso">{label}</span>
      {children}
      {hint && <span className="text-xs text-mocha">{hint}</span>}
    </label>
  );
}

export function Notice({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "bg-red-50 text-red-700",
    success: "bg-green-50 text-green-800",
    info: "bg-foam text-espresso",
  } as const;
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${styles[kind]}`}>
      {children}
    </p>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-latte bg-white p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold text-espresso">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-mocha">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-5 text-center text-sm text-mocha">{footer}</div>}
      </div>
    </div>
  );
}

export const linkClass = "font-medium text-caramel-dark hover:text-espresso";
