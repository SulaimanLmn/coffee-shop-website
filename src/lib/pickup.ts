// Brew Haven is in Indonesia (WIB, UTC+7, no DST).
const OFFSET_MS = 7 * 60 * 60 * 1000;
export const OPEN_HOUR = 7;
export const CLOSE_HOUR = 18;
export const SLOT_MINUTES = 15;
export const MIN_LEAD_MINUTES = 15;

export type PickupSlot = { value: string; label: string };

function wibParts(date: Date) {
  const shifted = new Date(date.getTime() + OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
}

function wibToDate(y: number, m: number, d: number, h: number, min: number): Date {
  return new Date(Date.UTC(y, m, d, h, min) - OFFSET_MS);
}

function labelFor(date: Date, now: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
  const a = wibParts(date);
  const b = wibParts(now);
  const sameDay = a.y === b.y && a.m === b.m && a.d === b.d;
  return `${sameDay ? "Today" : "Tomorrow"}, ${time}`;
}

/**
 * Pickup slots every 15 minutes inside opening hours, starting at least
 * MIN_LEAD_MINUTES from now. Falls over to tomorrow when the shop is closed.
 */
export function pickupSlots(now: Date = new Date(), max = 24): PickupSlot[] {
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;
  const slots: PickupSlot[] = [];
  for (let dayOffset = 0; dayOffset < 2 && slots.length < max; dayOffset++) {
    const { y, m, d } = wibParts(new Date(now.getTime() + dayOffset * 86_400_000));
    for (let mins = OPEN_HOUR * 60; mins < CLOSE_HOUR * 60; mins += SLOT_MINUTES) {
      const date = wibToDate(y, m, d, Math.floor(mins / 60), mins % 60);
      if (date.getTime() < earliest) continue;
      slots.push({ value: date.toISOString(), label: labelFor(date, now) });
      if (slots.length >= max) break;
    }
  }
  return slots;
}

/** Valid = on the slot grid, inside opening hours, and not in the past (5 min grace). */
export function isValidPickup(value: string, now: Date = new Date()): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const t = date.getTime();
  if (t < now.getTime() + 5 * 60_000) return false;
  if (t > now.getTime() + 2 * 86_400_000) return false;
  const shifted = new Date(t + OFFSET_MS);
  const mins = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  if (shifted.getUTCSeconds() !== 0 || shifted.getUTCMilliseconds() !== 0) return false;
  return (
    mins >= OPEN_HOUR * 60 &&
    mins < CLOSE_HOUR * 60 &&
    mins % SLOT_MINUTES === 0
  );
}
