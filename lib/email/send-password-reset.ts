import { sendPlatformEmail } from "@/lib/email/send-platform-email";

type PasswordResetEmailParams = {
  to: string;
  orgName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  const orgName = params.orgName?.trim() || "your workspace";

  const result = await sendPlatformEmail({
    to: params.to,
    subject: `Reset your ${orgName} password`,
    headline: "Reset your password",
    body: `We received a request to reset the password for your account on ${orgName}. The link below works once and expires in one hour. If you did not ask for this, you can ignore this email.`,
    actionLabel: "Choose a new password",
    actionUrl: params.resetUrl,
  });

  if (!result.ok) {
    throw new Error(result.error ?? "Password reset email failed");
  }
  return { ok: true, dev: result.skipped === true };
}
