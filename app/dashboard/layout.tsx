import { redirect } from "next/navigation";
import { canAccessInternalDashboard } from "@/lib/auth/permissions";
import { InternalShell } from "@/components/layout/internal-shell";
import {
  getOrgForSession,
  getSessionStaffTags,
  requireSession,
} from "@/lib/org/context";
import { resolvePrimaryColor } from "@/lib/theme/primary-color";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!canAccessInternalDashboard(session.user)) {
    redirect("/portal");
  }
  const [org, staffTags] = await Promise.all([
    getOrgForSession(session),
    getSessionStaffTags(session),
  ]);

  return (
    <InternalShell
      session={session}
      primaryColor={resolvePrimaryColor(org?.primaryColor)}
      logoUrl={org?.logoUrl}
      staffTags={staffTags}
    >
      {children}
    </InternalShell>
  );
}
