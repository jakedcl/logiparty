import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalShell } from "@/components/layout/portal-shell";
import { canAccessClientPortal } from "@/lib/auth/permissions";
import {
  getOrgForSession,
  getSessionClientCompany,
  requireSession,
} from "@/lib/org/context";
import { resolvePrimaryColor } from "@/lib/theme/primary-color";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const orgName = session?.user?.orgName?.trim() || "Client portal";
  return {
    title: {
      absolute: orgName,
    },
    description: `${orgName} client portal`,
  };
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!canAccessClientPortal(session.user)) {
    redirect("/dashboard");
  }

  const [org, company] = await Promise.all([
    getOrgForSession(session),
    getSessionClientCompany(session),
  ]);

  return (
    <PortalShell
      session={session}
      primaryColor={resolvePrimaryColor(org?.primaryColor)}
      logoUrl={org?.logoUrl}
      companyName={company?.name ?? null}
    >
      {children}
    </PortalShell>
  );
}
