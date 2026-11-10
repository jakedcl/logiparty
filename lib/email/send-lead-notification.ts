import { render } from "@react-email/render";
import { marketingFromHeader } from "@/lib/email/from";
import { LogipartyLeadEmail } from "@/lib/email/templates/logiparty-lead";

type LeadEmailParams = {
  name: string;
  email: string;
  company?: string | null;
  message?: string | null;
};

/** Notify Jake when someone requests access. No-op without RESEND + notify email. */
export async function sendLeadNotification(params: LeadEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEADS_NOTIFY_EMAIL?.trim();
  const from = marketingFromHeader();

  if (!apiKey || !notifyTo) {
    console.log(
      "\n[dev] Marketing lead (no Resend notify):\n",
      JSON.stringify(params, null, 2),
      "\n"
    );
    return { ok: true, emailed: false };
  }

  const company = params.company?.trim() || "(not provided)";
  const message = params.message?.trim() || "(none)";
  const html = await render(
    LogipartyLeadEmail({
      name: params.name,
      email: params.email,
      company,
      message,
    })
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: notifyTo,
      reply_to: params.email,
      subject: `Logiparty access request — ${params.name}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[leads] Resend notify failed:", text);
    return { ok: false, emailed: false };
  }
  return { ok: true, emailed: true };
}

