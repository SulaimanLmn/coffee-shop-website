import { describe, expect, it } from "vitest";
import { buildReceipt, canIssueReceipt } from "./receipt";
import {
  availability,
  availabilityLabel,
  buildProductWhere,
  orderByFor,
  parseAvailabilityFilter,
  parseBrowseParams,
} from "./catalog";
import { parseProductsView, productsHref } from "./admin-products";
import { safeReturn, withParam } from "./redirects";
import { buildSalesSeries, jakartaDayKey, jakartaDayStart } from "./stats";
import { normalizeCart, OrderError } from "./order-service";
import { isValidImageUrl, normalizeEmail, normalizePhone, parseIntStrict, slugify } from "./validation";
import { sniffImageType } from "./uploads";
import { signSession, verifySession } from "./auth";
import { formatPrice } from "./format";

describe("receipt", () => {
  const order = {
    midtransOrderId: "BH-TEST12345",
    orderDate: new Date("2026-10-14T03:00:00Z"),
    pickupTime: new Date("2026-10-14T03:30:00Z"),
    paidAt: new Date("2026-10-14T03:01:00Z"),
    paymentMethod: "gopay",
    paymentStatus: "PAID" as const,
    orderStatus: "PENDING" as const,
    totalAmount: 86000,
    user: { fullName: "Test User", email: "t@example.com" },
    items: [
      { productName: "Latte", quantity: 2, price: 30000 },
      { productName: "Cookie", quantity: 1, price: 26000 },
    ],
  };

  it("line totals sum to the order total", () => {
    const r = buildReceipt(order);
    expect(r.lines.map((l) => l.lineTotal)).toEqual([60000, 26000]);
    expect(r.subtotal).toBe(r.total);
    expect(r.number).toBe("BH-TEST12345");
    expect(r.issuedAt).toEqual(order.paidAt);
  });
  it("only paid (or refund-due) orders get receipts", () => {
    expect(canIssueReceipt("PAID")).toBe(true);
    expect(canIssueReceipt("REFUND_DUE")).toBe(true);
    for (const s of ["UNPAID", "FAILED", "EXPIRED"] as const) expect(canIssueReceipt(s)).toBe(false);
    expect(buildReceipt({ ...order, paymentStatus: "REFUND_DUE" }).refundDue).toBe(true);
  });
});

describe("catalog browsing", () => {
  it("parses and sanitises query params", () => {
    expect(parseBrowseParams({ q: "  latte ", sort: "price-asc", category: "bakery" })).toEqual({
      q: "latte",
      sort: "price-asc",
      category: "bakery",
    });
    expect(parseBrowseParams({ sort: "evil" }).sort).toBe("menu");
    expect(parseBrowseParams({ q: ["a", "b"] }).q).toBe("a");
    expect(parseBrowseParams({ q: "x".repeat(500) }).q).toHaveLength(100);
  });
  it("builds sort orders for price and name", () => {
    expect(orderByFor("price-asc")[0]).toEqual({ price: "asc" });
    expect(orderByFor("price-desc")[0]).toEqual({ price: "desc" });
    expect(orderByFor("name-asc")).toEqual([{ name: "asc" }]);
    expect(orderByFor("name-desc")).toEqual([{ name: "desc" }]);
  });
  it("combines search and category filters", () => {
    expect(buildProductWhere({ q: "lat", category: "hot-coffee" })).toEqual({
      name: { contains: "lat", mode: "insensitive" },
      category: { slug: "hot-coffee" },
    });
    expect(buildProductWhere({ q: "", category: "" })).toEqual({});
  });
  it("classifies availability", () => {
    expect(availability(true)).toBe("available");
    expect(availability(false)).toBe("unavailable");
    expect(availabilityLabel(true)).toBe("Available");
    expect(availabilityLabel(false)).toBe("Unavailable");
  });
  it("can restrict the admin list by availability", () => {
    expect(buildProductWhere({ q: "", category: "", availability: "available" })).toEqual({
      isAvailable: true,
    });
    expect(buildProductWhere({ q: "", category: "", availability: "unavailable" })).toEqual({
      isAvailable: false,
    });
    expect(parseAvailabilityFilter("unavailable")).toBe("unavailable");
    expect(parseAvailabilityFilter("bogus")).toBeNull();
    expect(parseAvailabilityFilter(undefined)).toBeNull();
  });
});

describe("normalizeCart", () => {
  it("merges duplicate lines", () => {
    const m = normalizeCart([
      { id: "a", quantity: 1 },
      { id: "a", quantity: 2 },
      { id: "b", quantity: 1 },
    ]);
    expect(m.get("a")).toBe(3);
    expect(m.size).toBe(2);
  });
  it("rejects empty, malformed, non-integer and oversized lines", () => {
    for (const bad of [[], null, [{ id: "a", quantity: 0 }], [{ id: "a", quantity: 1.5 }], [{ quantity: 1 }], [{ id: "a", quantity: 21 }]]) {
      expect(() => normalizeCart(bad)).toThrow(OrderError);
    }
  });
});

describe("validation", () => {
  it("normalises emails and phones", () => {
    expect(normalizeEmail(" A@B.com ")).toBe("a@b.com");
    expect(normalizeEmail("nope")).toBeNull();
    expect(normalizePhone("+62 812-3456-789")).toBe("+628123456789");
    expect(normalizePhone("abc")).toBeNull();
  });
  it("validates image URLs", () => {
    expect(isValidImageUrl("https://example.com/a.png")).toBe(true);
    expect(isValidImageUrl("/api/uploads/" + "a".repeat(32) + ".png")).toBe(true);
    expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
    expect(isValidImageUrl("/api/uploads/../../etc/passwd")).toBe(false);
  });
  it("parses strict integers and slugs", () => {
    expect(parseIntStrict("12", 1, 100)).toBe(12);
    expect(parseIntStrict("12.5", 1, 100)).toBeNull();
    expect(parseIntStrict("-1", 0, 100)).toBeNull();
    expect(parseIntStrict("101", 1, 100)).toBeNull();
    expect(slugify("Hot  Coffee!")).toBe("hot-coffee");
  });
});

describe("uploads", () => {
  it("detects real image types by magic bytes", () => {
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffImageType(Buffer.from("RIFF1234WEBPVP8 "))).toBe("webp");
    expect(sniffImageType(Buffer.from("<script>alert(1)</script>"))).toBeNull();
  });
});

describe("session tokens", () => {
  it("round-trips, and rejects tampering and expiry", () => {
    const now = 1_000_000;
    const token = signSession("user1", now + 100);
    expect(verifySession(token, now)).toBe("user1");
    expect(verifySession(token, now + 101)).toBeNull(); // expired
    expect(verifySession(token.replace("user1", "user2"), now)).toBeNull();
    expect(verifySession("garbage", now)).toBeNull();
  });
});

describe("formatPrice", () => {
  it("formats whole rupiah", () => {
    expect(formatPrice(28000).replace(/\s/g, " ")).toMatch(/Rp\s?28\.000/);
  });
});

describe("admin products view", () => {
  it("parses filters and drawer state", () => {
    expect(parseProductsView({})).toEqual({ q: "", category: "", avail: null, edit: null, isNew: false });
    expect(
      parseProductsView({ q: " latte ", category: "hot-coffee", avail: "unavailable", edit: "p1" })
    ).toEqual({ q: "latte", category: "hot-coffee", avail: "unavailable", edit: "p1", isNew: false });
    expect(parseProductsView({ new: "1" }).isNew).toBe(true);
  });

  it("keeps filters when building drawer links", () => {
    const view = parseProductsView({ q: "ice", avail: "available" });
    expect(productsHref({ ...view })).toBe("/admin/products?q=ice&avail=available");
    expect(productsHref({ ...view, isNew: true })).toBe("/admin/products?q=ice&avail=available&new=1");
    expect(productsHref({ ...view, edit: "p1", isNew: true })).toBe(
      "/admin/products?q=ice&avail=available&edit=p1"
    );
    expect(productsHref({})).toBe("/admin/products");
  });
});

describe("redirect helpers", () => {
  it("only accepts same-site paths", () => {
    expect(safeReturn("/admin/orders?x=1", "/")).toBe("/admin/orders?x=1");
    expect(safeReturn("//evil.com", "/")).toBe("/");
    expect(safeReturn("/\\evil.com", "/")).toBe("/");
    expect(safeReturn("https://evil.com", "/")).toBe("/");
    expect(safeReturn(null, "/fallback")).toBe("/fallback");
  });

  it("can restrict returns to a prefix", () => {
    expect(safeReturn("/admin/products?q=a", "/admin/products", "/admin/products")).toBe(
      "/admin/products?q=a"
    );
    expect(safeReturn("/admin/orders", "/admin/products", "/admin/products")).toBe("/admin/products");
    expect(safeReturn("/admin/productsx", "/admin/products", "/admin/products")).toBe("/admin/products");
  });

  it("adds params before the hash", () => {
    expect(withParam("/a", "notice", "ok go")).toBe("/a?notice=ok%20go");
    expect(withParam("/a?x=1#row", "notice", "y")).toBe("/a?x=1&notice=y#row");
  });
});

describe("dashboard stats helpers", () => {
  // 2026-10-14 20:00 UTC = 03:00 on the 15th in Jakarta
  const now = new Date("2026-10-14T20:00:00Z");

  it("uses the Jakarta calendar day", () => {
    expect(jakartaDayKey(now)).toBe("2026-10-15");
    expect(jakartaDayStart(now).toISOString()).toBe("2026-10-14T17:00:00.000Z");
  });

  it("zero-fills a 14-day series ending today and buckets by Jakarta day", () => {
    const series = buildSalesSeries(
      [
        { orderDate: new Date("2026-10-14T20:30:00Z"), totalAmount: 30000 }, // 15th (WIB)
        { orderDate: new Date("2026-10-15T01:00:00Z"), totalAmount: 20000 }, // 15th (WIB)
        { orderDate: new Date("2026-10-14T10:00:00Z"), totalAmount: 5000 }, // 14th (WIB)
      ],
      now
    );
    expect(series).toHaveLength(14);
    expect(series[13].key).toBe("2026-10-15");
    expect(series[13].amount).toBe(50000);
    expect(series[12].amount).toBe(5000);
    expect(series[0].amount).toBe(0);
    expect(series[0].key).toBe("2026-10-02");
  });
});
