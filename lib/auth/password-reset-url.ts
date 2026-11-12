export function formatPasswordResetUrl(
  token: string,
  orgSlug: string,
  opts: { dev: boolean; rootDomain?: string }
) {
  const root =
    opts.rootDomain?.replace(/^www\./, "") ??
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim()?.replace(/^www\./, "") ??
    "logiparty.com";
  if (opts.dev) {
    return `http://${orgSlug}.localhost:3000/reset-password/${token}`;
  }
  return `https://${orgSlug}.${root}/reset-password/${token}`;
}

/** Build tenant-scoped reset link (same host pattern as invites). */
export function buildPasswordResetUrl(token: string, orgSlug: string) {
  return formatPasswordResetUrl(token, orgSlug, {
    dev: process.env.NODE_ENV === "development",
  });
}

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export function passwordResetExpiresAt(now = Date.now()) {
  return new Date(now + PASSWORD_RESET_TTL_MS);
}

export function isPasswordResetTokenActive(
  row: { expiresAt: Date; usedAt: Date | null },
  now = new Date()
) {
  return row.usedAt == null && row.expiresAt > now;
}
