import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  createJob,
  listJobClientCompanies,
  listJobs,
} from "@/lib/actions/jobs";
import { JOB_STATUSES } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function JobsPage() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const [jobList, companies] = await Promise.all([
    listJobs(session.user.orgId),
    listJobClientCompanies(session.user.orgId),
  ]);

  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const activeJobs = jobList.filter((j) => j.status !== "denied");
  const rejectedJobs = jobList.filter((j) => j.status === "denied");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jobs"
        description="Create and manage jobs. Statuses: draft → upcoming → ready → completed (or draft → denied)."
      />

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
              " Use + New job below to create one."
            )}
          </p>
        ) : (
          <div className="app-table-wrap -mx-4 sm:mx-0">
            <table className="app-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th className="w-[9rem]">Status</th>
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
                <span className="text-neutral-400 group-open:hidden" aria-hidden>
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
              <table className="app-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Client</th>
                    <th className="w-[9rem]">Status</th>
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

        {companies.length > 0 ? (
          <details className="group border-t border-border pt-5">
            <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="text-neutral-400 group-open:hidden" aria-hidden>
                  +
                </span>
                <span
                  className="hidden text-neutral-400 group-open:inline"
                  aria-hidden
                >
                  −
                </span>
                New job
              </span>
            </summary>
            <form action={createJob} className="mt-4 space-y-3 max-w-xl">
              <label className="app-label">
                Job name
                <input
                  name="name"
                  required
                  placeholder="Job name"
                  className="app-input mt-1"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="app-label">
                  Client company
                  <select
                    name="clientCompanyId"
                    required
                    className="app-input mt-1"
                  >
                    <option value="">Select…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="app-label">
                  Status
                  <select
                    name="status"
                    defaultValue="upcoming"
                    className="app-input mt-1"
                  >
                    {JOB_STATUSES.filter((s) => s !== "denied").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="app-label">
                  Job start
                  <input
                    type="datetime-local"
                    name="jobStart"
                    className="app-input mt-1"
                  />
                </label>
                <label className="app-label">
                  Job end
                  <input
                    type="datetime-local"
                    name="jobEnd"
                    className="app-input mt-1"
                  />
                </label>
              </div>
              <button type="submit" className="app-btn app-btn-primary">
                Create job
              </button>
            </form>
          </details>
        ) : null}
      </section>
    </div>
  );
}
