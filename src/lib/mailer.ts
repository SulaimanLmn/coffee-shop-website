import nodemailer from "nodemailer";

/**
 * Outgoing email over SMTP. Configure SMTP_HOST (and usually SMTP_PORT,
 * SMTP_USER, SMTP_PASS, MAIL_FROM). Without SMTP_HOST nothing is sent and password
 * reset runs in demonstration mode (the new-password page opens directly).
 */
export function mailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

function transport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
}

/** Sends the reset link. Returns false (and logs) if mail is not configured or sending fails. */
export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset the password for your Brew Haven account.",
    `Open this link within 60 minutes to choose a new password:`,
    link,
    "",
    "If you did not ask for this, you can ignore this email. Your password will not change.",
    "",
    "Brew Haven",
  ].join("\n");
  try {
    await transport().sendMail({
      from: process.env.MAIL_FROM ?? "Brew Haven <no-reply@brewhaven.test>",
      to,
      subject: "Reset your Brew Haven password",
      text,
    });
    return true;
  } catch (e) {
    console.error("Password reset email failed", e);
    return false;
  }
}
