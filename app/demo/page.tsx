import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DemoTour } from "@/components/demo/demo-tour";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import { getOrgSlugFromHost } from "@/lib/org/subdomain";

export const metadata: Metadata = {
  title: "Product demo — Logiparty",
  description:
    "Interactive walkthrough of jobs, inventory, fleet, crew, and the white-label client portal. No login required.",
};

function isBareLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export default async function DemoPage() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host") ??
    "";
  const orgSlug = getOrgSlugFromHost(host);

  // Demo is an apex marketing surface. Real tenant subdomains bounce home.
  // Bare localhost may have NEXT_PUBLIC_DEV_ORG_SLUG set — still allow /demo.
  if (orgSlug && !isBareLocalHost(host)) {
    redirect(absoluteRedirectUrl(headersList, "/"));
  }

  return <DemoTour />;
}
