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

const NEEDS_LIMIT = 5;
const UPCOMING_LIMIT = 8;

function firstNameFrom(name: string | null | undefined): string | null {
  const part = name?.trim().split(/\s+/)[0];
  return part || null;
}

function statusClass(status: string): string {
  switch (status) {
    case "draft":
      return "bg-amber-100 text-amber-900";
    case "upcoming":
      return "bg-sky-100 text-sky-900";
    case "ready":
      return "bg-emerald-100 text-emerald-900";
    case "completed":
      return "bg-neutral-200 text-neutral-700";
    case "denied":
      return "bg-red-100 text-red-900";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {firstName ? `Welcome, ${firstName}` : "Welcome"}
          </h1>
          <p className="text-sm text-neutral-500">
            {orgName}
            <span className="text-neutral-300"> · </span>
            {roleLine}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm shrink-0">
          {isManager ? (
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800"
            >
              + New job
            </Link>
          ) : null}
          {isStaff && !isManager ? (
            <>
              <Link
                href="/dashboard/my-jobs"
                className="font-medium text-neutral-900 hover:underline"
              >
                My Jobs
              </Link>
              {canTimeOff ? (
                <Link
                  href="/dashboard/settings/time-off"
                  className="text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                  Time off
                </Link>
              ) : null}
            </>
          ) : null}
          {isManager && canTimeOff ? (
            <Link
              href="/dashboard/settings/time-off"
              className="text-neutral-500 hover:text-neutral-800 hover:underline"
            >
              Time off
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Needs attention
            {needs.length > 0 ? (
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({notifications.length})
              </span>
            ) : null}
          </h2>
          <Link
            href="/dashboard/notifications"
            className="text-xs text-neutral-400 hover:text-neutral-700"
          >
            View all →
          </Link>
        </div>

        {needs.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">Nothing pending.</p>
        ) : (
          <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[480px] text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                  <th className="py-2 px-3 font-medium w-[6.5rem]">Type</th>
                  <th className="py-2 px-3 font-medium">Item</th>
                  <th className="py-2 px-3 font-medium w-[7.5rem] text-right">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {needs.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                      {kindLabel(item.kind)}
                    </td>
                    <td className="py-2 px-3">
                      <Link
                        href={
                          item.kind === "client_note"
                            ? "/dashboard/notifications"
                            : item.href
                        }
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-neutral-500 text-xs mt-0.5 line-clamp-1">
                        {item.detail}
                      </p>
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-neutral-400 whitespace-nowrap">
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
          <h2 className="text-sm font-medium text-neutral-800">
            Upcoming work
            {upcoming.length > 0 ? (
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({upcoming.length}
                {upcoming.length >= UPCOMING_LIMIT ? "+" : ""})
              </span>
            ) : null}
          </h2>
          <Link
            href={upcomingAllHref}
            className="text-xs text-neutral-400 hover:text-neutral-700"
          >
            View all →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">{upcomingEmpty}</p>
        ) : (
          <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[560px] text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Client</th>
                  <th className="py-2 px-3 font-medium w-[7rem]">Status</th>
                  <th className="py-2 px-3 font-medium w-[7.5rem]">Date</th>
                  <th className="py-2 px-3 font-medium w-[4rem] text-right">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="py-2 px-3 font-medium text-neutral-900">
                      <Link href={job.href} className="hover:underline">
                        {job.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-neutral-600">
                      {job.clientName}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${statusClass(job.status)}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                      {fmtJobDate(job.jobStart)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={job.href}
                        className="text-xs text-neutral-400 hover:text-neutral-700"
                      >
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
