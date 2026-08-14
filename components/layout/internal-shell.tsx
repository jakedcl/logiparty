import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { Session } from "next-auth";
import {
  canManageClientInventory,
  canManageFleet,
  canManageOrgInventory,
  canManageOrgSettings,
  canManageTools,
  canInviteUsers,
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
  const showSettings = canManageOrgSettings(session.user);
  const showTeam = canInviteUsers(session.user);
  const showInventory = canManageOrgInventory(session.user, staffTags);
  const showClientInventory = canManageClientInventory(session.user, staffTags);
  const showFleet = canManageFleet(session.user);
  const showTools = canManageTools(session.user, staffTags);

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
            {showInventory && (
              <Link
                href="/dashboard/inventory"
                className="hover:text-neutral-900"
              >
                Inventory
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
            {showTools && (
              <Link href="/dashboard/tools" className="hover:text-neutral-900">
                Tools
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
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
