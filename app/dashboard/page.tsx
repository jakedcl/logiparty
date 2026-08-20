import Link from "next/link";
import { listJobClientCompanies, listJobs } from "@/lib/actions/jobs";
import { listMyJobs } from "@/lib/actions/my-jobs";
import { listNotifications } from "@/lib/actions/notifications";
import {
  canManageJobs,
  canSubmitAvailability,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import type { Job } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

const NEEDS_LIMIT = 5;
const UPCOMING_LIMIT = 8;

function firstNameFrom(name: string | null | undefined): string | null {
  const part = name?.trim().split(/\s+/)[0];
  return part || null;
}

function kindLabel(
  kind: "draft_request" | "inventory_request" | "client_note" | "assignment"
): string {
  switch (kind) {
    case "draft_request":
      return "Job request";
    case "inventory_request":
      return "Inventory";
    case "client_note":
      return "Note";
    case "assignment":
      return "Assignment";
  }
}

function fmtJobDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtWhen(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Soonest job_start first; undated jobs last. Operational “what’s next.” */
function sortSoonestFirst<T extends { jobStart: Date | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const at = a.jobStart?.getTime() ?? Number.POSITIVE_INFINITY;
    const bt = b.jobStart?.getTime() ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
}

type UpcomingRow = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  jobStart: Date | null;
  href: string;
};

export default async function DashboardPage() {
  const session = await requireSession();
  const isManager = canManageJobs(session.user);
  const isStaff = canViewMyJobs(session.user);
  const canTimeOff = canSubmitAvailability(session.user);
  const firstName = firstNameFrom(session.user.name);
  const orgName = session.user.orgName;

  const [notifications, managerJobs, companies, myJobs] = await Promise.all([
    listNotifications(session.user.orgId).catch(() => []),
    isManager ? listJobs(session.user.orgId) : Promise.resolve([] as Job[]),
    isManager
      ? listJobClientCompanies(session.user.orgId)
      : Promise.resolve([]),
    // Staff-only upcoming; dual manager+staff uses org-wide list above.
    isStaff && !isManager
      ? listMyJobs(session.user.orgId)
      : Promise.resolve([]),
  ]);

  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  let upcoming: UpcomingRow[] = [];
  let upcomingAllHref = "/dashboard/jobs";
  let upcomingEmpty = "No upcoming jobs.";

  if (isManager) {
    const ops = sortSoonestFirst(
      managerJobs.filter(
        (j) => j.status === "upcoming" || j.status === "ready"
      )
    );
    upcoming = ops.slice(0, UPCOMING_LIMIT).map((j) => ({
      id: j.id,
      name: j.name,
      clientName: companyName.get(j.clientCompanyId) ?? "Client",
      status: j.status,
      jobStart: j.jobStart,
      href: `/dashboard/jobs/${j.id}`,
    }));
    upcomingAllHref = "/dashboard/jobs";
    upcomingEmpty = "No upcoming or ready jobs.";
  } else if (isStaff) {
    const ops = sortSoonestFirst(
      myJobs.filter((j) => j.status === "upcoming" || j.status === "ready")
    );
    upcoming = ops.slice(0, UPCOMING_LIMIT).map((j) => ({
      id: j.id,
      name: j.name,
      clientName: j.clientCompanyName,
      status: j.status,
      jobStart: j.jobStart,
      href: `/dashboard/my-jobs/${j.id}`,
    }));
    upcomingAllHref = "/dashboard/my-jobs";
    upcomingEmpty = "No assigned jobs yet.";
  }

  const needs = notifications.slice(0, NEEDS_LIMIT);
  const roleLine = isManager
    ? "Review requests, keep jobs moving, and stay ahead of the floor."
    : "Your assigned jobs and time off — what’s next for you.";

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={
          <>
            {orgName}
            <span className="text-[var(--faint)]"> · </span>
            {roleLine}
          </>
        }
        actions={
          <>
            {isManager ? (
              <Link href="/dashboard/jobs" className="lp-btn">
                + New job
              </Link>
            ) : null}
            {isStaff && !isManager ? (
              <>
                <Link
                  href="/dashboard/my-jobs"
                  className="font-semibold text-[var(--foreground)] hover:underline"
                >
                  My Jobs
                </Link>
                {canTimeOff ? (
                  <Link
                    href="/dashboard/settings/time-off"
                    className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
                  >
                    Time off
                  </Link>
                ) : null}
              </>
            ) : null}
            {isManager && canTimeOff ? (
              <Link
                href="/dashboard/settings/time-off"
                className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
              >
                Time off
              </Link>
            ) : null}
          </>
        }
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="lp-section-title">
            Needs attention
            {needs.length > 0 ? (
              <span className="lp-section-meta">({notifications.length})</span>
            ) : null}
          </h2>
          <Link href="/dashboard/notifications" className="lp-link-quiet">
            View all →
          </Link>
        </div>

        {needs.length === 0 ? (
          <p className="py-4 text-sm text-[var(--muted)]">Nothing pending.</p>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table min-w-[480px]">
              <thead>
                <tr>
                  <th className="w-[6.5rem]">Type</th>
                  <th>Item</th>
                  <th className="w-[7.5rem] text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap">{kindLabel(item.kind)}</td>
                    <td>
                      <Link
                        href={
                          item.kind === "client_note"
                            ? "/dashboard/notifications"
                            : item.href
                        }
                        className="lp-cell-strong hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--subtle)]">
                        {item.detail}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-right text-xs text-[var(--faint)]">
                      <time>{fmtWhen(item.createdAt)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="lp-section-title">
            Upcoming work
            {upcoming.length > 0 ? (
              <span className="lp-section-meta">
                ({upcoming.length}
                {upcoming.length >= UPCOMING_LIMIT ? "+" : ""})
              </span>
            ) : null}
          </h2>
          <Link href={upcomingAllHref} className="lp-link-quiet">
            View all →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="py-4 text-sm text-[var(--muted)]">{upcomingEmpty}</p>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th className="w-[7rem]">Status</th>
                  <th className="w-[7.5rem]">Date</th>
                  <th className="w-[4rem] text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link
                        href={job.href}
                        className="lp-cell-strong hover:underline"
                      >
                        {job.name}
                      </Link>
                    </td>
                    <td>{job.clientName}</td>
                    <td>
                      <StatusBadge status={job.status} kind="job" />
                    </td>
                    <td className="whitespace-nowrap">
                      {fmtJobDate(job.jobStart)}
                    </td>
                    <td className="text-right">
                      <Link href={job.href} className="lp-link-quiet">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
