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
  "Plan client inventory, trucks, crew, and load windows in one workspace built for event-logistics teams.";
