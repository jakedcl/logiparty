import Link from "next/link";
import { redirect } from "next/navigation";
import { canViewMyJobs } from "@/lib/auth/permissions";
import { listMyJobs } from "@/lib/actions/my-jobs";
import { requireSession } from "@/lib/org/context";
import { formatJobDate } from "@/lib/format/date";
import { parseYearMonth } from "@/lib/jobs/calendar";
import { JobsMonthCalendar } from "@/components/jobs/jobs-month-calendar";
import { JobsViewToggle } from "@/components/jobs/jobs-view-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function MyJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) redirect("/dashboard");

  const params = await searchParams;
  const view = params.view === "calendar" ? "calendar" : "list";
  const { year, month } = parseYearMonth(params.month);

  const jobs = await listMyJobs(session.user.orgId);

  const calendarJobs = jobs.map((job) => ({
    id: job.id,
    name: job.name,
    status: job.status,
    clientLabel: job.clientCompanyName,
    jobStart: job.jobStart,
    jobEnd: job.jobEnd,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Jobs"
        description="Jobs where you have a load-in or load-out assignment."
        actions={
          <JobsViewToggle
            basePath="/dashboard/my-jobs"
            view={view}
            month={params.month}
          />
        }
      />

      {jobs.length === 0 ? (
        <p className="app-empty">
          No assigned jobs yet. A manager will add you to a crew.
        </p>
      ) : view === "calendar" ? (
        <JobsMonthCalendar
          jobs={calendarJobs}
          hrefBase="/dashboard/my-jobs"
          year={year}
          month={month}
        />
      ) : (
        <div className="app-table-wrap -mx-4 sm:mx-0">
          <table className="app-table min-w-[640px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th className="w-[7rem]">Status</th>
                <th className="w-[11rem]">Date</th>
                <th className="w-[8rem]">Phase</th>
                <th className="w-[4rem] text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="font-medium text-neutral-900">
                    <Link
                      href={`/dashboard/my-jobs/${job.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {job.name}
                    </Link>
                  </td>
                  <td className="text-neutral-600">{job.clientCompanyName}</td>
                  <td>
                    <StatusBadge status={job.status} kind="job" />
                  </td>
                  <td className="whitespace-nowrap text-neutral-600 tabular-nums">
                    {formatJobDate(job.jobStart)}
                  </td>
                  <td className="text-neutral-500 text-xs">
                    {job.phases.length ? job.phases.join(", ") : "—"}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/dashboard/my-jobs/${job.id}`}
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
    </div>
  );
}
