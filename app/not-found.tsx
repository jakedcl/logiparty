import { headers } from "next/headers";
import MarketingNotFound from "@/app/(marketing)/not-found";
import { TenantNotFound } from "@/components/not-found/tenant-not-found";

/** Branded 404 for unknown paths (tenant subdomain vs marketing apex). */
export default async function GlobalNotFound() {
  const slug = (await headers()).get("x-org-slug");
  if (slug) {
    return <TenantNotFound />;
  }
  return <MarketingNotFound />;
}
