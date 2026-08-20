type LeadEmailParams = {
  name: string;
  email: string;
  company?: string | null;
  message?: string | null;
};

/** Notify Jake when someone requests access. No-op without RESEND + notify email. */
export async function sendLeadNotification(params: LeadEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo =
    process.env.LEADS_NOTIFY_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Logiparty <onboarding@resend.dev>";

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
      html: `<p><strong>${escapeHtml(params.name)}</strong> requested access.</p>
<p>Email: ${escapeHtml(params.email)}<br/>Company: ${escapeHtml(company)}</p>
<p>Message:</p>
<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[leads] Resend notify failed:", text);
    return { ok: false, emailed: false };
  }
  return { ok: true, emailed: true };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
