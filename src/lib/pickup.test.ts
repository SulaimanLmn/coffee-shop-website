import { describe, expect, it } from "vitest";
import { isValidPickup, pickupSlots } from "./pickup";

// 2026-10-14 03:00 UTC = 10:00 WIB
const now = new Date("2026-10-14T03:00:00Z");

describe("pickupSlots", () => {
  it("starts at least 15 minutes ahead on a 15-minute grid", () => {
    const slots = pickupSlots(now, 5);
    expect(slots[0].value).toBe("2026-10-14T03:15:00.000Z"); // 10:15 WIB
    expect(slots).toHaveLength(5);
    for (const s of slots) expect(new Date(s.value).getUTCMinutes() % 15).toBe(0);
  });

  it("rolls to tomorrow after closing", () => {
    const late = new Date("2026-10-14T12:00:00Z"); // 19:00 WIB
    const first = pickupSlots(late, 1)[0];
    expect(first.value).toBe("2026-10-14T00:00:00.000Z".replace("14T", "15T")); // 07:00 WIB next day
    expect(first.label).toMatch(/^Tomorrow/);
  });

  it("never offers a slot at or after closing (18:00 WIB)", () => {
    const all = pickupSlots(now, 200);
    for (const s of all) {
      const wibHour = (new Date(s.value).getUTCHours() + 7) % 24;
      expect(wibHour).toBeGreaterThanOrEqual(7);
      expect(wibHour).toBeLessThan(18);
    }
  });
});

describe("isValidPickup", () => {
  it("accepts offered slots", () => {
    expect(isValidPickup(pickupSlots(now, 1)[0].value, now)).toBe(true);
  });
  it("rejects past, off-grid, closed-hours, malformed and far-future values", () => {
    expect(isValidPickup("2026-10-14T02:00:00.000Z", now)).toBe(false); // past
    expect(isValidPickup("2026-10-14T03:20:00.000Z", now)).toBe(false); // off grid
    expect(isValidPickup("2026-10-14T11:30:00.000Z", now)).toBe(false); // 18:30 WIB
    expect(isValidPickup("not-a-date", now)).toBe(false);
    expect(isValidPickup("2026-10-20T03:00:00.000Z", now)).toBe(false); // too far
  });
});
