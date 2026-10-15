import { describe, expect, it } from "vitest";
import { buildReceipt, canIssueReceipt } from "./receipt";
import { availability, availabilityLabel, orderByFor, parseBrowseParams, buildProductWhere } from "./catalog";
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
  it("can restrict the admin list to available products", () => {
    expect(buildProductWhere({ q: "", category: "", onlyAvailable: true })).toEqual({
      isAvailable: true,
    });
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
