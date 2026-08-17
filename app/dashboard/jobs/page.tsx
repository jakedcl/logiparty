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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Jobs</h1>
        <p className="text-sm text-neutral-500">
          Create and manage jobs. Statuses: draft → upcoming → ready →
          completed.
        </p>
      </div>

      {companies.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Add a{" "}
          <Link href="/dashboard/clients" className="underline">
            client company
          </Link>{" "}
          before creating jobs.
        </p>
      ) : (
        <section className="border rounded-lg p-4 bg-white max-w-2xl">
          <h2 className="font-medium mb-3">New job</h2>
          <form action={createJob} className="space-y-3">
            <input
              name="name"
              required
              placeholder="Job name"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm text-neutral-600">
                Client company
                <select
                  name="clientCompanyId"
                  required
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-neutral-600">
                Status
                <select
                  name="status"
                  defaultValue="upcoming"
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
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
              <label className="text-sm text-neutral-600">
                Job start
                <input
                  type="datetime-local"
                  name="jobStart"
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-neutral-600">
                Job end
                <input
                  type="datetime-local"
                  name="jobEnd"
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
            >
              Create job
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">All jobs ({jobList.length})</h2>
        {jobList.length === 0 && (
          <p className="text-sm text-neutral-500">No jobs yet.</p>
        )}
        <ul className="divide-y border rounded-lg bg-white max-w-2xl">
          {jobList.map((job) => (
            <li key={job.id}>
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-sm">{job.name}</p>
                  <p className="text-xs text-neutral-500">
                    {companyName.get(job.clientCompanyId) ?? "Client"} ·{" "}
                    <span className="capitalize">{job.status}</span>
                    {job.status === "draft" ? " · needs accept" : ""}
                  </p>
                </div>
                <span className="text-xs text-neutral-400">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
