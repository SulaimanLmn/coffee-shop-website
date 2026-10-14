"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orders";
import { OrderError, transitionOrder } from "@/lib/order-service";

function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

function withParam(url: string, key: string, value: string): string {
  const [path, hash = ""] = url.split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}

function revalidateOrders(orderId: string) {
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin", "layout");
}

async function customerTransition(formData: FormData, to: "CANCELLED" | "COMPLETED") {
  const user = await requireUser("/orders");
  const orderId = String(formData.get("orderId") ?? "");
  const back = safeReturn(formData.get("return"), "/orders");
  const notice = to === "CANCELLED" ? "cancelled" : "completed";
  try {
    await transitionOrder({ orderId, to, actor: "CUSTOMER", userId: user.id });
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
    redirect(withParam(back, "error", e.message));
  }
  revalidateOrders(orderId);
  redirect(withParam(back, "notice", notice));
}

export async function cancelOrderAction(formData: FormData) {
  await customerTransition(formData, "CANCELLED");
}

export async function confirmReceivedAction(formData: FormData) {
  await customerTransition(formData, "COMPLETED");
}

export async function adminUpdateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const to = String(formData.get("status") ?? "");
  const back = safeReturn(formData.get("return"), "/admin/orders");
  if (!isOrderStatus(to)) redirect(withParam(back, "error", "Invalid status."));
  try {
    await transitionOrder({ orderId, to, actor: "ADMIN" });
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
    redirect(withParam(back, "error", e.message));
  }
  revalidateOrders(orderId);
  redirect(withParam(back, "notice", "updated"));
}
