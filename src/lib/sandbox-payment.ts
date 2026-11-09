/**
 * Midtrans Sandbox test details shown to people trying the demo (e.g. the supervisor).
 * Sandbox payments never move real money. Kept in one place so every guide agrees.
 */
export const SANDBOX_CARD = {
  number: "4811 1111 1111 1114",
  expiry: "12/30",
  cvv: "123",
  otp: "112233",
} as const;

/** Midtrans payment simulator: pays a Sandbox virtual account, QRIS or e-wallet code. */
export const SANDBOX_SIMULATOR_URL = "https://simulator.sandbox.midtrans.com/";
