import { headers } from "next/headers";
import { signOut } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import type { Session } from "next-auth";
import { DevRoleSwitchPanel } from "@/components/dev/dev-role-switch-panel";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/layout/dashboard-shell";
import { SessionIdentity } from "@/components/layout/session-identity";
import {
  canManageClientInventory,
  canManageFleet,
  canManageJobs,
  canManageOrgInventory,
  canInviteUsers,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { FALLBACK_PRIMARY_COLOR } from "@/lib/theme/primary-color";

type Props = {
  session: Session;
  primaryColor?: string;
  logoUrl?: string | null;
  staffTags?: string[];
  children: React.ReactNode;
};

async function signOutAction() {
  "use server";
  const headersList = await headers();
  await signOut({
    redirectTo: absoluteRedirectUrl(headersList, "/login"),
  });
}

export function InternalShell({
  session,
  primaryColor = FALLBACK_PRIMARY_COLOR,
  logoUrl,
  staffTags = [],
  children,
}: Props) {
  const orgName = session.user.orgName ?? "Organization";
  const showTeam = canInviteUsers(session.user);
  const showInventory = canManageOrgInventory(session.user, staffTags);
  const showClientInventory = canManageClientInventory(session.user, staffTags);
  const showFleet = canManageFleet(session.user);
  const showJobs = canManageJobs(session.user);
  const showMyJobs = canViewMyJobs(session.user);
  const showNotifications = showJobs || showMyJobs;

  const navItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];
  if (showJobs) navItems.push({ href: "/dashboard/jobs", label: "Jobs" });
  if (showMyJobs) navItems.push({ href: "/dashboard/my-jobs", label: "My Jobs" });
  if (showNotifications) {
    navItems.push({ href: "/dashboard/notifications", label: "Notifications" });
  }
  if (showInventory) {
    navItems.push({ href: "/dashboard/inventory", label: "Our inventory" });
  }
  if (showClientInventory) {
    navItems.push({
      href: "/dashboard/client-inventory",
      label: "Client inventory",
    });
  }
  if (showFleet) navItems.push({ href: "/dashboard/fleet", label: "Fleet" });
  if (showTeam) {
    navItems.push({ href: "/dashboard/team", label: "Team" });
    navItems.push({ href: "/dashboard/clients", label: "Clients" });
  }
  // My Profile lives under Settings — always show the hub
  navItems.push({ href: "/dashboard/settings", label: "Settings" });

  return (
    <>
      <DashboardShell
        orgName={orgName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        navItems={navItems}
        accountMenu={
          <SessionIdentity
            name={session.user.name}
            email={session.user.email}
            isOrgAdmin={session.user.isOrgAdmin}
            isManager={session.user.isManager}
            isStaff={session.user.isStaff}
            isClient={session.user.isClient}
            staffTags={staffTags}
            profileHref="/dashboard/settings/profile"
            signOutAction={signOutAction}
          />
        }
      >
        {children}
      </DashboardShell>
      <DevRoleSwitchPanel />
    </>
  );
}
