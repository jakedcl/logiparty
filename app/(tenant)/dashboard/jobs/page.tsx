import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  listJobClientCompanies,
  listJobLeadCandidates,
  listJobs,
} from "@/lib/actions/jobs";
import { requireSession } from "@/lib/org/context";
import { formatJobDate } from "@/lib/format/date";
import { parseYearMonth } from "@/lib/jobs/calendar";
import { JobsMonthCalendar } from "@/components/jobs/jobs-month-calendar";
import { JobsViewToggle } from "@/components/jobs/jobs-view-toggle";
import { NewJobModal } from "@/components/jobs/new-job-modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; new?: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const params = await searchParams;
  const openNew = params.new === "1";
  const view = params.view === "calendar" ? "calendar" : "list";
  const { year, month } = parseYearMonth(params.month);

  const [jobList, companies, leadCandidates] = await Promise.all([
    listJobs(session.user.orgId),
    listJobClientCompanies(session.user.orgId),
    listJobLeadCandidates(session.user.orgId),
  ]);

  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const activeJobs = jobList.filter((j) => j.status !== "denied");
  const rejectedJobs = jobList.filter((j) => j.status === "denied");

  const calendarJobs = activeJobs.map((job) => ({
    id: job.id,
    name: job.name,
    status: job.status,
    clientLabel: companyName.get(job.clientCompanyId) ?? "Client",
    jobStart: job.jobStart,
    jobEnd: job.jobEnd,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jobs"
        description="Create and manage jobs. Statuses: draft → upcoming → ready → completed (or draft → denied)."
        actions={
          <>
            {companies.length > 0 ? (
              <NewJobModal
                companies={companies}
                leadCandidates={leadCandidates}
                defaultOpen={openNew}
              />
            ) : null}
            <JobsViewToggle
              basePath="/dashboard/jobs"
              view={view}
              month={params.month}
            />
          </>
        }
      />

      {view === "calendar" ? (
        <section className="space-y-3">
          <h2 className="app-section-label">
            Calendar
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({activeJobs.length})
            </span>
          </h2>
          {activeJobs.length === 0 ? (
            <p className="app-empty">No jobs yet to show on the calendar.</p>
          ) : (
            <JobsMonthCalendar
              jobs={calendarJobs}
              hrefBase="/dashboard/jobs"
              year={year}
              month={month}
            />
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="app-section-label">
              All jobs
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({activeJobs.length})
              </span>
            </h2>
          </div>

          {activeJobs.length === 0 ? (
            <p className="app-empty">
              No jobs yet.
              {companies.length === 0 ? (
                <>
                  {" "}
                  Add a{" "}
                  <Link href="/dashboard/clients" className="app-link">
                    client company
                  </Link>{" "}
                  before creating jobs.
                </>
              ) : (
                " Use + New job to create one."
              )}
            </p>
          ) : (
            <div className="app-table-wrap -mx-4 sm:mx-0">
              <table className="app-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Client</th>
                    <th className="w-[9rem]">Status</th>
                    <th className="w-[11rem]">Date</th>
                    <th className="w-[4rem] text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-medium text-neutral-900">
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {job.name}
                        </Link>
                      </td>
                      <td className="text-neutral-600">
                        {companyName.get(job.clientCompanyId) ?? "Client"}
                      </td>
                      <td>
                        <StatusBadge status={job.status} kind="job" />
                        {job.status === "draft" ? (
                          <span className="ml-1.5 text-xs text-neutral-400">
                            needs accept
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap text-neutral-600 tabular-nums">
                        {formatJobDate(job.jobStart)}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="text-xs text-neutral-400 hover:text-neutral-700"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rejectedJobs.length > 0 ? (
            <details className="group border-t border-border pt-5">
              <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className="text-neutral-400 group-open:hidden"
                    aria-hidden
                  >
                    +
                  </span>
                  <span
                    className="hidden text-neutral-400 group-open:inline"
                    aria-hidden
                  >
                    −
                  </span>
                  Rejected
                  <span className="font-normal text-neutral-400">
                    ({rejectedJobs.length})
                  </span>
                </span>
              </summary>
              <div className="mt-3 app-table-wrap -mx-4 sm:mx-0">
                <table className="app-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Client</th>
                      <th className="w-[9rem]">Status</th>
                      <th className="w-[11rem]">Date</th>
                      <th className="w-[4rem] text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="font-medium text-neutral-900">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="hover:underline underline-offset-2"
                          >
                            {job.name}
                          </Link>
                        </td>
                        <td className="text-neutral-600">
                          {companyName.get(job.clientCompanyId) ?? "Client"}
                        </td>
                        <td>
                          <StatusBadge status={job.status} kind="job" />
                        </td>
                        <td className="whitespace-nowrap text-neutral-600 tabular-nums">
                          {formatJobDate(job.jobStart)}
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
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
            </details>
          ) : null}
        </section>
      )}
    </div>
  );
}
