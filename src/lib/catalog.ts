export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "ROASTING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILLMENT_FLOW: OrderStatus[] = [
  "PAID",
  "ROASTING",
  "SHIPPED",
  "DELIVERED",
];

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = FULFILLMENT_FLOW.indexOf(current);
  if (idx === -1 || idx === FULFILLMENT_FLOW.length - 1) return null;
  return FULFILLMENT_FLOW[idx + 1];
}

export function statusTimestampField(status: OrderStatus):
  | "paidAt"
  | "roastedAt"
  | "shippedAt"
  | "deliveredAt"
  | null {
  switch (status) {
    case "PAID":
      return "paidAt";
    case "ROASTING":
      return "roastedAt";
    case "SHIPPED":
      return "shippedAt";
    case "DELIVERED":
      return "deliveredAt";
    default:
      return null;
  }
}

export function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pending payment",
    PAID: "Paid",
    ROASTING: "Roasting",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status];
}

export function asOrderStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "PENDING";
}

export const CATEGORIES = [
  { slug: "beans", label: "Coffee Beans", blurb: "Whole-bean singles and blends, roasted to order." },
  { slug: "drinks", label: "Ready Drinks", blurb: "Cold brew and canned coffee, ready to pour." },
  { slug: "gear", label: "Brew Gear", blurb: "Grinders, brewers, and accessories for home baristas." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export const ROAST_LEVELS = ["Light", "Medium", "Dark"] as const;
