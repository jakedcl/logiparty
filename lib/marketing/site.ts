import { buildApexOrigin } from "@/lib/org/subdomain";

/** Canonical marketing site origin (apex). */
export function getMarketingOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return buildApexOrigin();
  }
  return `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || "logiparty.com"}`;
}

export const MARKETING_DESCRIPTION =
  "Run sheets, inventory locks, fleet, crew, and a white-label client portal for live-event logistics 3PLs.";
