const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Prices are stored as whole IDR (no minor units). */
export function formatPrice(amount: number): string {
  return idr.format(amount);
}

const TZ = "Asia/Jakarta";

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TZ }).format(
    new Date(date)
  );
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: TZ }).format(
    new Date(date)
  );
}
