import { sendOrgEmail } from "@/lib/email/send-org-email";

type InviteEmailParams = {
  to: string;
  orgName: string;
  inviteUrl: string;
  fromName?: string | null;
};

export async function sendInviteEmail(params: InviteEmailParams) {
  const orgName =
    params.orgName?.trim() || params.fromName?.trim() || "Your organization";

  if (!process.env.RESEND_API_KEY) {
    console.log(
      "\n[dev] Invite link (no RESEND_API_KEY):\n",
      params.inviteUrl,
      "\n"
    );
    return { ok: true, dev: true };
  }

  const result = await sendOrgEmail({
    to: params.to,
    orgName,
    subject: `You're invited to ${orgName}`,
    headline: `Join ${orgName}`,
    body: `You've been invited to join ${orgName}. Accept within 7 days using the button below.`,
    actionLabel: "Accept invitation",
    actionUrl: params.inviteUrl,
  });

  if (!result.ok) {
    throw new Error(result.error ?? "Invite email failed");
  }
  return { ok: true, dev: false };
}

export function buildInviteUrl(token: string, orgSlug: string) {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  const root =
    (configured ? configured.replace(/^www\./, "") : null) ?? "logiparty.com";
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return `http://${orgSlug}.localhost:3000/invite/${token}`;
  }
  return `https://${orgSlug}.${root}/invite/${token}`;
}
