import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { auth } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";
import {
  buildTenantOrigin,
  getOrgSlugFromHost,
} from "@/lib/org/subdomain";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host") ??
    "";
  const orgSlug = getOrgSlugFromHost(host);

  if (!orgSlug) {
    return {
      title: "Logiparty — Ops software for event logistics 3PLs",
      description:
        "Jobs, inventory, fleet, and a white-label client portal for live-event 3PLs. Invite-only.",
    };
  }

  return {
    title: "Operations",
    description: "Logistics operations dashboard",
  };
}

export default async function HomePage() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host") ??
    "";
  // Host only — do not use x-org-slug (JWT may inject slug on apex).
  const orgSlug = getOrgSlugFromHost(host);
  const session = await auth();

  // Tenant subdomain: existing app entry (dashboard / portal / login).
  if (orgSlug) {
    if (session?.user) {
      redirect(absoluteRedirectUrl(headersList, postAuthPath(session.user)));
    }
    redirect(absoluteRedirectUrl(headersList, "/login"));
  }

  // Apex (logiparty.com / www / bare localhost without DEV_ORG_SLUG): marketing.
  const workspace =
    session?.user?.orgSlug != null
      ? {
          orgName: session.user.orgName || session.user.orgSlug,
          href: `${buildTenantOrigin(session.user.orgSlug)}${postAuthPath(session.user)}`,
          isClient: session.user.isClient === true,
        }
      : null;

  return <MarketingHome workspace={workspace} />;
}
