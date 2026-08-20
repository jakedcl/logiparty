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

export default async function JobsPage() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const [jobList, companies] = await Promise.all([
    listJobs(session.user.orgId),
    listJobClientCompanies(session.user.orgId),
  ]);

  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Jobs</h1>
        <p className="text-sm text-neutral-500">
          Create and manage jobs. Statuses: draft → upcoming → ready →
          completed.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            All jobs
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({jobList.length})
            </span>
          </h2>
        </div>

        {jobList.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No jobs yet.
            {companies.length === 0 ? (
              <>
                {" "}
                Add a{" "}
                <Link href="/dashboard/clients" className="underline">
                  client company
                </Link>{" "}
                before creating jobs.
              </>
            ) : (
              " Use + New job below to create one."
            )}
          </p>
        ) : (
          <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[520px] text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Client</th>
                  <th className="py-2 px-3 font-medium w-[7rem]">Status</th>
                  <th className="py-2 px-3 font-medium w-[4rem] text-right">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobList.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="py-2 px-3 font-medium text-neutral-900">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="hover:underline"
                      >
                        {job.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-neutral-600">
                      {companyName.get(job.clientCompanyId) ?? "Client"}
                    </td>
                    <td className="py-2 px-3 capitalize text-neutral-600">
                      {job.status}
                      {job.status === "draft" ? (
                        <span className="text-neutral-400"> · needs accept</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-3 text-right">
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

        {companies.length > 0 ? (
          <details className="group border-t border-neutral-200 pt-4">
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
            <form action={createJob} className="mt-3 space-y-3 max-w-xl">
              <label className="block text-xs text-neutral-500">
                Job name
                <input
                  name="name"
                  required
                  placeholder="Job name"
                  className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-neutral-500">
                  Client company
                  <select
                    name="clientCompanyId"
                    required
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-neutral-500">
                  Status
                  <select
                    name="status"
                    defaultValue="upcoming"
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm bg-white"
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-neutral-500">
                  Job start
                  <input
                    type="datetime-local"
                    name="jobStart"
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-neutral-500">
                  Job end
                  <input
                    type="datetime-local"
                    name="jobEnd"
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
              >
                Create job
              </button>
            </form>
          </details>
        ) : null}
      </section>
    </div>
  );
}
