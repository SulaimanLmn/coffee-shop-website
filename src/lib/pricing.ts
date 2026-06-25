export const FREE_SHIPPING_THRESHOLD_CENTS = 4000;
export const SHIPPING_FLAT_CENTS = 500;

export function shippingFor(subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return SHIPPING_FLAT_CENTS;
}

export function grandTotal(subtotalCents: number): number {
  return subtotalCents + shippingFor(subtotalCents);
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
