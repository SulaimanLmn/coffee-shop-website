import { describe, expect, it } from "vitest";
import { adminNextStatuses, checkTransition, newMidtransOrderId } from "./orders";

describe("checkTransition", () => {
  it("lets admin move PENDING -> PREPARING -> READY on paid orders", () => {
    expect(checkTransition("PENDING", "PREPARING", "ADMIN", "PAID").ok).toBe(true);
    expect(checkTransition("PREPARING", "READY", "ADMIN", "PAID").ok).toBe(true);
  });

  it("blocks admin skipping, going backwards, or completing/cancelling", () => {
    expect(checkTransition("PENDING", "READY", "ADMIN", "PAID").ok).toBe(false);
    expect(checkTransition("READY", "PREPARING", "ADMIN", "PAID").ok).toBe(false);
    expect(checkTransition("READY", "COMPLETED", "ADMIN", "PAID").ok).toBe(false);
    expect(checkTransition("PENDING", "CANCELLED", "ADMIN", "PAID").ok).toBe(false);
  });

  it("blocks admin from processing unpaid orders", () => {
    expect(checkTransition("PENDING", "PREPARING", "ADMIN", "UNPAID").ok).toBe(false);
  });

  it("lets a customer cancel only while PENDING", () => {
    expect(checkTransition("PENDING", "CANCELLED", "CUSTOMER", "PAID").ok).toBe(true);
    expect(checkTransition("PREPARING", "CANCELLED", "CUSTOMER", "PAID").ok).toBe(false);
    expect(checkTransition("READY", "CANCELLED", "CUSTOMER", "PAID").ok).toBe(false);
  });

  it("lets a customer confirm receipt only when READY", () => {
    expect(checkTransition("READY", "COMPLETED", "CUSTOMER", "PAID").ok).toBe(true);
    expect(checkTransition("PREPARING", "COMPLETED", "CUSTOMER", "PAID").ok).toBe(false);
    expect(checkTransition("PENDING", "COMPLETED", "CUSTOMER", "PAID").ok).toBe(false);
  });

  it("never leaves terminal states", () => {
    for (const to of ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"] as const) {
      expect(checkTransition("COMPLETED", to, "ADMIN", "PAID").ok).toBe(false);
      expect(checkTransition("CANCELLED", to, "CUSTOMER", "PAID").ok).toBe(false);
    }
  });
});

describe("adminNextStatuses", () => {
  it("offers only the single forward step", () => {
    expect(adminNextStatuses("PENDING")).toEqual(["PREPARING"]);
    expect(adminNextStatuses("PREPARING")).toEqual(["READY"]);
    expect(adminNextStatuses("READY")).toEqual([]);
    expect(adminNextStatuses("COMPLETED")).toEqual([]);
  });
});

describe("newMidtransOrderId", () => {
  it("is prefixed, short, and unique enough", () => {
    const ids = new Set(Array.from({ length: 500 }, newMidtransOrderId));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^BH-[A-Z0-9]{9}$/);
  });
});
