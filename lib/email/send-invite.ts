type InviteEmailParams = {
  to: string;
  orgName: string;
  inviteUrl: string;
  fromName?: string;
};

export async function sendInviteEmail(params: InviteEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ??
    `${params.fromName ?? params.orgName} <onboarding@resend.dev>`;

  if (!apiKey) {
    console.log("\n[dev] Invite link (no RESEND_API_KEY):\n", params.inviteUrl, "\n");
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `You're invited to ${params.orgName}`,
      html: `<p>You've been invited to join <strong>${params.orgName}</strong>.</p><p><a href="${params.inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed: ${text}`);
  }
  return { ok: true, dev: false };
}

export function buildInviteUrl(token: string, orgSlug: string) {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  const root = (configured ? configured.replace(/^www\./, "") : null) ?? "logiparty.com";
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return `http://${orgSlug}.localhost:3000/invite/${token}`;
  }
  return `https://${orgSlug}.${root}/invite/${token}`;
}
