import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canManageJobs,
  canManageOrgSettings,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export default async function HelpPage() {
  const session = await requireSession();
  const orgName = session.user.orgName ?? "your organization";
  const isManager = canManageJobs(session.user);
  const isAdmin = canManageOrgSettings(session.user);
  const isStaff = canViewMyJobs(session.user) && !isManager;

  if (session.user.isClient) redirect("/portal");

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="lp-page-title">Help</h1>
        <p className="lp-page-sub">
          Core workflow for {orgName} — pick your role below.
        </p>
      </div>

      {isAdmin ? (
        <section className="space-y-3 rounded-md border border-[var(--border-subtle)] p-4">
          <h2 className="text-base font-semibold">Org admin checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--foreground)]">
            <li>
              Confirm branding under{" "}
              <Link href="/dashboard/settings" className="lp-link-quiet">
                Settings
              </Link>
              .
            </li>
            <li>
              Invite managers and crew from{" "}
              <Link href="/dashboard/team" className="lp-link-quiet">
                Team
              </Link>
              .
            </li>
            <li>
              Add client companies and portal contacts under{" "}
              <Link href="/dashboard/clients" className="lp-link-quiet">
                Clients
              </Link>
              .
            </li>
            <li>
              Seed inventory (client, equipment, fleet) before first jobs go{" "}
              <span className="text-[var(--muted)]">ready</span>.
            </li>
            <li>
              Review{" "}
              <Link href="/dashboard/notifications" className="lp-link-quiet">
                Notifications
              </Link>{" "}
              daily for portal requests.
            </li>
          </ol>
        </section>
      ) : null}

      {isManager ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Managers</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>
              Accept or deny portal job drafts from Notifications or job detail.
            </li>
            <li>
              Assign inventory, fleet, and crew until jobs promote to{" "}
              <span className="text-[var(--foreground)]">ready</span>.
            </li>
            <li>
              Use{" "}
              <Link href="/dashboard/reports" className="lp-link-quiet">
                Reports
              </Link>{" "}
              for utilization snapshots.
            </li>
          </ul>
        </section>
      ) : null}

      {isStaff ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Crew</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>
              <Link href="/dashboard/my-jobs" className="lp-link-quiet">
                My Jobs
              </Link>{" "}
              lists every assignment with load-in/out windows.
            </li>
            <li>
              Update loaded quantities on assigned jobs when you are warehouse
              tagged.
            </li>
            <li>
              Remove yourself from a slot you cannot make — managers get
              notified.
            </li>
          </ul>
        </section>
      ) : null}

      <p className="text-sm">
        <Link href="/dashboard/settings/profile" className="lp-link-quiet">
          Profile & notification preferences
        </Link>
      </p>
    </div>
  );
}
