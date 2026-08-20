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
  canManageBilling,
  canManageOrgSettings,
  canInviteUsers,
  canReviewAvailability,
  canSubmitAvailability,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { isStripeConfigured } from "@/lib/stripe";

type Props = {
  session: Session;
  primaryColor?: string;
  logoUrl?: string | null;
  staffTags?: string[];
  children: React.ReactNode;
};

export function InternalShell({
  session,
  primaryColor = "#2563eb",
  logoUrl,
  staffTags = [],
  children,
}: Props) {
  const orgName = session.user.orgName ?? "Organization";
  const showSettings = canManageOrgSettings(session.user);
  const showBilling =
    canManageBilling(session.user) && isStripeConfigured();
  // Managers without org-settings still need a settings entry when Stripe isn't live
  const showSettingsFallback =
    !showSettings &&
    !showBilling &&
    canManageBilling(session.user);
  const showTeam = canInviteUsers(session.user);
  const showInventory = canManageOrgInventory(session.user, staffTags);
  const showClientInventory = canManageClientInventory(session.user, staffTags);
  const showFleet = canManageFleet(session.user);
  const showJobs = canManageJobs(session.user);
  const showActivityLog = canManageJobs(session.user);
  const showMyJobs = canViewMyJobs(session.user);
  const showAvailability =
    canSubmitAvailability(session.user) || canReviewAvailability(session.user);

  const navItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];
  if (showJobs) navItems.push({ href: "/dashboard/jobs", label: "Jobs" });
  if (showMyJobs) navItems.push({ href: "/dashboard/my-jobs", label: "My Jobs" });
  if (showAvailability) {
    navItems.push({ href: "/dashboard/availability", label: "Availability" });
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
  if (showActivityLog) {
    navItems.push({ href: "/dashboard/activity", label: "Activity" });
  }
  if (showSettings || showSettingsFallback) {
    navItems.push({ href: "/dashboard/settings", label: "Settings" });
  }
  if (showBilling) {
    navItems.push({ href: "/dashboard/settings#billing", label: "Billing" });
  }

  return (
    <>
      <DashboardShell
        orgName={orgName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        navItems={navItems}
        identity={
          <SessionIdentity
            name={session.user.name}
            email={session.user.email}
            isOrgAdmin={session.user.isOrgAdmin}
            isManager={session.user.isManager}
            isStaff={session.user.isStaff}
            isClient={session.user.isClient}
            staffTags={staffTags}
          />
        }
        signOut={
          <form
            action={async () => {
              "use server";
              const headersList = await headers();
              await signOut({
                redirectTo: absoluteRedirectUrl(headersList, "/login"),
              });
            }}
          >
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-800 min-h-[44px] px-1"
            >
              Sign out
            </button>
          </form>
        }
      >
        {children}
      </DashboardShell>
      <DevRoleSwitchPanel />
    </>
  );
}
