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
  { slug: "hot-coffee", label: "Hot Coffee", blurb: "Espresso, milk drinks, and Americanos — pulled fresh to order." },
  { slug: "iced-coffee", label: "Iced Coffee", blurb: "Cold brew and iced espresso drinks for warm afternoons." },
  { slug: "non-coffee", label: "Non-Coffee", blurb: "Chai, hot chocolate, and tea for the caffeine-averse." },
  { slug: "bakery", label: "Bakery", blurb: "Cookies, croissants, and treats baked fresh each morning." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}
