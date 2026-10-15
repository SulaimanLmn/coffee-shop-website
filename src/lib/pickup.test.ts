import { describe, expect, it } from "vitest";
import { isValidPickup, pickupSlots, pickupUrgency, urgencyLabel } from "./pickup";

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

describe("pickupUrgency", () => {
  const base = new Date("2026-10-14T03:00:00Z");
  const plus = (min: number) => new Date(base.getTime() + min * 60_000);

  it("flags overdue, soon and later pickups", () => {
    expect(pickupUrgency(plus(-5), base)).toEqual({ kind: "overdue", minutes: 5 });
    expect(pickupUrgency(plus(0), base)).toEqual({ kind: "soon", minutes: 0 });
    expect(pickupUrgency(plus(15), base)).toEqual({ kind: "soon", minutes: 15 });
    expect(pickupUrgency(plus(16), base)).toEqual({ kind: "later", minutes: 16 });
  });

  it("accepts ISO strings", () => {
    expect(pickupUrgency(plus(30).toISOString(), base).minutes).toBe(30);
  });

  it("labels urgency in words, not just colour", () => {
    expect(urgencyLabel({ kind: "overdue", minutes: 5 })).toBe("Overdue 5 min");
    expect(urgencyLabel({ kind: "soon", minutes: 0 })).toBe("Due now");
    expect(urgencyLabel({ kind: "soon", minutes: 12 })).toBe("in 12 min");
    expect(urgencyLabel({ kind: "later", minutes: 60 })).toBe("in 1 h");
    expect(urgencyLabel({ kind: "later", minutes: 85 })).toBe("in 1 h 25 min");
  });
});
