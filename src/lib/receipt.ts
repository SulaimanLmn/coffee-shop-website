import type { OrderStatus, PaymentStatus } from "@/lib/orders";

export type ReceiptOrder = {
  midtransOrderId: string;
  orderDate: Date;
  pickupTime: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  user: { fullName: string; email: string };
  items: { productName: string; quantity: number; price: number }[];
};

export type Receipt = {
  number: string;
  issuedAt: Date;
  pickupTime: Date;
  customerName: string;
  customerEmail: string;
  lines: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  refundDue: boolean;
};

/** Receipts exist for orders that were actually paid (including ones now awaiting refund). */
export function canIssueReceipt(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === "PAID" || paymentStatus === "REFUND_DUE";
}

export function buildReceipt(order: ReceiptOrder): Receipt {
  const lines = order.items.map((i) => ({
    name: i.productName,
    quantity: i.quantity,
    unitPrice: i.price,
    lineTotal: i.price * i.quantity,
  }));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return {
    number: order.midtransOrderId,
    issuedAt: order.paidAt ?? order.orderDate,
    pickupTime: order.pickupTime,
    customerName: order.user.fullName,
    customerEmail: order.user.email,
    lines,
    subtotal,
    total: order.totalAmount,
    paymentMethod: order.paymentMethod ?? "Midtrans",
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    refundDue: order.paymentStatus === "REFUND_DUE",
  };
}
