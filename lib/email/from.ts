/** Parsed `EMAIL_FROM` (or legacy `RESEND_FROM_EMAIL`). */
export function parsedEmailFromEnv(): {
  address: string;
  envDisplayName: string | null;
} {
  const raw =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "";

  if (!raw) {
    return { address: "onboarding@resend.dev", envDisplayName: null };
  }

  const angle = raw.match(/^(.+?)\s*<([^>]+)>\s*$/);
  if (angle) {
    const name = angle[1]
      .trim()
      .replace(/^["']|["']$/g, "");
    return { address: angle[2].trim(), envDisplayName: name || null };
  }

  if (raw.includes("@")) {
    return { address: raw, envDisplayName: null };
  }

  return { address: "onboarding@resend.dev", envDisplayName: null };
}

/** Tenant mail: org display name + verified sending address from env. */
export function tenantFromHeader(orgName: string): string {
  const { address } = parsedEmailFromEnv();
  const display = orgName.trim() || "Operations";
  return `${display} <${address}>`;
}

/** Apex / marketing mail: Logiparty (or env display name) + same address. */
export function marketingFromHeader(): string {
  const { address, envDisplayName } = parsedEmailFromEnv();
  const display = envDisplayName?.trim() || "Logiparty";
  return `${display} <${address}>`;
}
