import { describe, expect, it } from "vitest";
import {
  expectedSignature,
  failureReasonFor,
  mapTransactionStatus,
  notificationUrlFor,
  parseGross,
  paymentLabel,
  verifyNotificationSignature,
} from "./midtrans";

describe("mapTransactionStatus", () => {
  it("maps success states to PAID", () => {
    expect(mapTransactionStatus("settlement", undefined)).toBe("PAID");
    expect(mapTransactionStatus("capture", "accept")).toBe("PAID");
  });
  it("treats challenge and pending as still waiting", () => {
    expect(mapTransactionStatus("capture", "challenge")).toBe("PENDING");
    expect(mapTransactionStatus("pending", undefined)).toBe("PENDING");
  });
  it("maps declines, cancellations and expiry", () => {
    expect(mapTransactionStatus("deny", undefined)).toBe("FAILED");
    expect(mapTransactionStatus("cancel", undefined)).toBe("FAILED");
    expect(mapTransactionStatus("capture", "deny")).toBe("FAILED");
    expect(mapTransactionStatus("expire", undefined)).toBe("EXPIRED");
  });
  it("ignores refund/unknown statuses", () => {
    expect(mapTransactionStatus("refund", undefined)).toBe("IGNORE");
    expect(mapTransactionStatus(undefined, undefined)).toBe("IGNORE");
  });
});

describe("notification signature", () => {
  const key = "SB-Mid-server-test";
  const base = { order_id: "BH-ABC123XYZ", status_code: "200", gross_amount: "58000.00" };

  it("accepts a correct SHA-512 signature", () => {
    const signature_key = expectedSignature(base.order_id, base.status_code, base.gross_amount, key);
    expect(verifyNotificationSignature({ ...base, signature_key }, key)).toBe(true);
  });
  it("rejects a tampered amount or missing fields", () => {
    const signature_key = expectedSignature(base.order_id, base.status_code, base.gross_amount, key);
    expect(
      verifyNotificationSignature({ ...base, gross_amount: "1.00", signature_key }, key)
    ).toBe(false);
    expect(verifyNotificationSignature({ ...base }, key)).toBe(false);
    expect(verifyNotificationSignature({ ...base, signature_key: "bad" }, key)).toBe(false);
  });
});

describe("helpers", () => {
  it("parses Midtrans gross amounts", () => {
    expect(parseGross("58000.00")).toBe(58000);
    expect(parseGross(undefined)).toBeNaN();
  });
  it("builds readable payment labels", () => {
    expect(paymentLabel({ payment_type: "credit_card" })).toBe("credit card");
    expect(paymentLabel({ payment_type: "bank_transfer", va_numbers: [{ bank: "bca", va_number: "1" }] })).toBe(
      "bank transfer (BCA)"
    );
    expect(paymentLabel({})).toBeNull();
  });
});

describe("failureReasonFor", () => {
  it("gives a specific reason for each failed Midtrans status", () => {
    expect(failureReasonFor("deny")).toMatch(/declined/);
    expect(failureReasonFor("cancel")).toMatch(/cancelled/);
    expect(failureReasonFor("expire")).toMatch(/expired/);
    expect(failureReasonFor("failure")).toMatch(/could not process/);
  });

  it("falls back to a generic reason for unknown statuses", () => {
    expect(failureReasonFor(undefined)).toMatch(/declined, cancelled or could not be processed/);
  });
});

describe("notificationUrlFor", () => {
  it("points Midtrans at the webhook of a public HTTPS deployment", () => {
    expect(notificationUrlFor("https://brew-haven.vercel.app")).toBe(
      "https://brew-haven.vercel.app/api/webhooks/midtrans"
    );
    expect(notificationUrlFor("https://brew-haven.vercel.app/")).toBe(
      "https://brew-haven.vercel.app/api/webhooks/midtrans"
    );
  });

  it("sends no override on a local machine", () => {
    expect(notificationUrlFor("http://localhost:3000")).toBeNull();
    expect(notificationUrlFor(undefined)).toBeNull();
  });
});
