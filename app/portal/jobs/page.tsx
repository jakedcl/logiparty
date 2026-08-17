import Link from "next/link";
import { requestJob, listPortalJobs } from "@/lib/actions/portal-jobs";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

export default async function PortalJobsPage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const jobList = company
    ? await listPortalJobs(session.user.orgId)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Request a job and track status for {company?.name ?? "your company"}.
        </p>
      </div>

      {!company ? (
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium mb-3">New request</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Submits as a draft for the warehouse team to accept. You cannot
            edit it after sending.
          </p>
          <form action={requestJob} className="space-y-3">
            <input
              name="name"
              required
              placeholder="Job name (e.g. Summer Festival Activation)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
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
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="clientPocName"
                placeholder="On-site contact name"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                name="clientPocPhone"
                placeholder="On-site contact phone"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="notes"
              rows={3}
              placeholder="Details for the team (location, timing, notes)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
            >
              Submit request
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Your jobs ({jobList.length})</h2>
        {jobList.length === 0 ? (
          <p className="text-sm text-neutral-500">No jobs yet.</p>
        ) : (
          <ul className="divide-y border rounded-lg bg-white">
            {jobList.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/portal/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-sm">{job.name}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {job.status}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
