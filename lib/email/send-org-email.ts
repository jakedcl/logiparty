import { render } from "@react-email/render";
import { EventEmail } from "@/lib/email/templates/event-email";
import { tenantFromHeader } from "@/lib/email/from";

export type SendOrgEmailParams = {
  to: string | string[];
  orgName: string;
  subject: string;
  headline: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
};

export async function sendOrgEmail(params: SendOrgEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const toList = Array.isArray(params.to) ? params.to : [params.to];
  const html = await render(
    EventEmail({
      orgName: params.orgName,
      headline: params.headline,
      body: params.body,
      actionLabel: params.actionLabel,
      actionUrl: params.actionUrl,
    })
  );

  if (!apiKey) {
    console.log(
      `[email] skip (no RESEND_API_KEY): ${params.subject} → ${toList.join(", ")}`
    );
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: tenantFromHeader(params.orgName),
      to: toList,
      subject: params.subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[email] Resend failed: ${text}`);
    return { ok: false, error: text };
  }
  return { ok: true, skipped: false };
}
