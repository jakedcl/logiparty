import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { canAccessClientPortal } from "@/lib/auth/permissions";
import {
  getOrgForSession,
  getSessionClientCompany,
  requireSession,
} from "@/lib/org/context";

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
      primaryColor={org?.primaryColor ?? "#2563eb"}
      logoUrl={org?.logoUrl}
      companyName={company?.name ?? null}
    >
      {children}
    </PortalShell>
  );
}
