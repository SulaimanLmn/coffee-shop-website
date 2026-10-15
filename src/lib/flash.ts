/** Query params that carry a one-off success message, turned into a toast by FlashToast. */
export const FLASH_PARAMS = ["notice", "saved", "pwsaved"] as const;

const CODES: Record<string, string> = {
  cancelled: "Order cancelled.",
  completed: "Order marked as received. Enjoy!",
  updated: "Order updated.",
};

/** Known short codes map to a sentence; anything else is already a sentence. */
export function flashMessage(param: string, value: string): string {
  if (param === "saved") return "Profile updated.";
  if (param === "pwsaved") return "Password changed.";
  return CODES[value] ?? value;
}
