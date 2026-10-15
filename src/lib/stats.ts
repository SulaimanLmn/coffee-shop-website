// Pure helpers for the admin dashboard. The café runs on Jakarta time (UTC+7, no DST).
const TZ = "Asia/Jakarta";
const DAY_MS = 86_400_000;

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const dayLabelFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});

/** Calendar day in Jakarta as YYYY-MM-DD. */
export function jakartaDayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

/** The instant the current Jakarta day started. */
export function jakartaDayStart(now: Date = new Date()): Date {
  return new Date(`${jakartaDayKey(now)}T00:00:00+07:00`);
}

export type SalesPoint = { key: string; label: string; amount: number };

/** Revenue per Jakarta day for the last `days` days, oldest first, zero-filled. */
export function buildSalesSeries(
  orders: { orderDate: Date; totalAmount: number }[],
  now: Date = new Date(),
  days = 14
): SalesPoint[] {
  const totals = new Map<string, number>();
  for (const o of orders) {
    const key = jakartaDayKey(o.orderDate);
    totals.set(key, (totals.get(key) ?? 0) + o.totalAmount);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * DAY_MS);
    const key = jakartaDayKey(date);
    return { key, label: dayLabelFormat.format(date), amount: totals.get(key) ?? 0 };
  });
}
