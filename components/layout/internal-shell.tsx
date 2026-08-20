import Link from "next/link";
import { headers } from "next/headers";
import { signOut } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import type { Session } from "next-auth";
import { DevRoleSwitchPanel } from "@/components/dev/dev-role-switch-panel";
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
  const orgName = session.user.orgName;
  const showSettings =
    canManageOrgSettings(session.user) || canManageBilling(session.user);
  const showTeam = canInviteUsers(session.user);
  const showInventory = canManageOrgInventory(session.user, staffTags);
  const showClientInventory = canManageClientInventory(session.user, staffTags);
  const showFleet = canManageFleet(session.user);
  const showJobs = canManageJobs(session.user);
  const showActivityLog = canManageJobs(session.user);
  const showMyJobs = canViewMyJobs(session.user);
  const showAvailability =
    canSubmitAvailability(session.user) || canReviewAvailability(session.user);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b bg-white px-4 py-3 flex items-center justify-between no-print"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-auto max-w-[120px]" />
            ) : null}
            <span className="font-semibold text-lg tracking-tight">
              {orgName}
            </span>
          </div>
          <nav className="flex gap-4 text-sm text-neutral-600">
            <Link href="/dashboard" className="hover:text-neutral-900">
              Dashboard
            </Link>
            {showJobs && (
              <Link href="/dashboard/jobs" className="hover:text-neutral-900">
                Jobs
              </Link>
            )}
            {showMyJobs && (
              <Link
                href="/dashboard/my-jobs"
                className="hover:text-neutral-900"
              >
                My Jobs
              </Link>
            )}
            {showAvailability && (
              <Link
                href="/dashboard/availability"
                className="hover:text-neutral-900"
              >
                Availability
              </Link>
            )}
            {showInventory && (
              <Link
                href="/dashboard/inventory"
                className="hover:text-neutral-900"
              >
                Our inventory
              </Link>
            )}
            {showClientInventory && (
              <Link
                href="/dashboard/client-inventory"
                className="hover:text-neutral-900"
              >
                Client inventory
              </Link>
            )}
            {showFleet && (
              <Link href="/dashboard/fleet" className="hover:text-neutral-900">
                Fleet
              </Link>
            )}
            {showTeam && (
              <>
                <Link href="/dashboard/team" className="hover:text-neutral-900">
                  Team
                </Link>
                <Link
                  href="/dashboard/clients"
                  className="hover:text-neutral-900"
                >
                  Clients
                </Link>
              </>
            )}
            {showSettings && (
              <Link
                href="/dashboard/settings"
                className="hover:text-neutral-900"
              >
                Settings
              </Link>
            )}
            {showActivityLog && (
              <Link
                href="/dashboard/activity"
                className="text-neutral-400 hover:text-neutral-600"
              >
                Activity
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SessionIdentity
            name={session.user.name}
            email={session.user.email}
            isOrgAdmin={session.user.isOrgAdmin}
            isManager={session.user.isManager}
            isStaff={session.user.isStaff}
            isClient={session.user.isClient}
            staffTags={staffTags}
          />
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
              className="text-sm text-neutral-500 hover:text-neutral-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
      <DevRoleSwitchPanel />
    </div>
  );
}
