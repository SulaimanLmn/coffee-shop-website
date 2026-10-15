import { describe, expect, it } from "vitest";
import {
  adminActionLabel,
  adminNextStatuses,
  adminOrdersHref,
  boardColumns,
  checkTransition,
  newMidtransOrderId,
  parseAdminOrdersView,
  type OrderStatus,
} from "./orders";

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

describe("adminActionLabel", () => {
  it("names the one-click admin actions", () => {
    expect(adminActionLabel("PREPARING")).toBe("Start preparing");
    expect(adminActionLabel("READY")).toBe("Mark ready");
  });
});

describe("boardColumns", () => {
  const at = (iso: string, orderStatus: OrderStatus, id: string) => ({
    id,
    orderStatus,
    pickupTime: new Date(iso),
  });

  it("groups by status and sorts by soonest pickup", () => {
    const cols = boardColumns([
      at("2026-10-15T05:30:00Z", "PENDING", "late"),
      at("2026-10-15T05:00:00Z", "PENDING", "early"),
      at("2026-10-15T04:00:00Z", "PREPARING", "prep"),
      at("2026-10-15T03:00:00Z", "READY", "ready"),
    ]);
    expect(cols.PENDING.map((o) => o.id)).toEqual(["early", "late"]);
    expect(cols.PREPARING.map((o) => o.id)).toEqual(["prep"]);
    expect(cols.READY.map((o) => o.id)).toEqual(["ready"]);
  });

  it("ignores orders that are not on the board", () => {
    const cols = boardColumns([
      at("2026-10-15T05:00:00Z", "COMPLETED", "done"),
      at("2026-10-15T05:00:00Z", "CANCELLED", "gone"),
    ]);
    expect(cols).toEqual({ PENDING: [], PREPARING: [], READY: [] });
  });
});

describe("parseAdminOrdersView", () => {
  it("defaults to the live board", () => {
    expect(parseAdminOrdersView({})).toEqual({
      view: "board",
      status: null,
      q: "",
      page: 1,
      order: null,
    });
  });

  it("reads history filters and sanitises junk", () => {
    expect(
      parseAdminOrdersView({ view: "history", status: "READY", q: "  latte ", page: "3", order: "abc" })
    ).toEqual({ view: "history", status: "READY", q: "latte", page: 3, order: "abc" });
    const bad = parseAdminOrdersView({ view: "x", status: "NOPE", page: "-4" });
    expect(bad.view).toBe("board");
    expect(bad.status).toBeNull();
    expect(bad.page).toBe(1);
    expect(parseAdminOrdersView({ page: "abc" }).page).toBe(1);
  });
});

describe("adminOrdersHref", () => {
  it("omits default values", () => {
    expect(adminOrdersHref({})).toBe("/admin/orders");
    expect(adminOrdersHref({ view: "board", page: 1 })).toBe("/admin/orders");
  });
  it("round-trips the view state", () => {
    const href = adminOrdersHref({ view: "history", status: "PENDING", q: "a b", page: 2, order: "x1" });
    expect(href).toBe("/admin/orders?view=history&status=PENDING&q=a+b&page=2&order=x1");
  });
});
