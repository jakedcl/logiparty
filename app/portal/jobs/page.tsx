import Link from "next/link";
import { requestJob, listPortalJobs } from "@/lib/actions/portal-jobs";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

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
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function fmtShort(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function PortalJobsPage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const jobList = company ? await listPortalJobs(session.user.orgId) : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Request a job and track status for {company?.name ?? "your company"}.
        </p>
      </div>

      <section className="space-y-3 order-1 md:order-2">
        <h2 className="font-medium">Your jobs ({jobList.length})</h2>
        {jobList.length === 0 ? (
          <p className="text-sm text-neutral-500">No jobs yet.</p>
        ) : (
          <ul className="space-y-2">
            {jobList.map((job) => {
              const when = fmtShort(job.jobStart);
              return (
                <li key={job.id}>
                  <Link
                    href={`/portal/jobs/${job.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-4 min-h-[56px] active:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-base truncate">{job.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {when ? `${when} · ` : ""}
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 capitalize ${statusClass(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </p>
                    </div>
                    <span className="text-sm text-neutral-400 shrink-0">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {!company ? (
        <p className="text-sm text-neutral-500 order-2 md:order-1">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <section className="border rounded-lg p-4 bg-white order-2 md:order-1">
          <h2 className="font-medium mb-1">New request</h2>
          <p className="text-xs text-neutral-500 mb-4">
            Submits as a draft for the team to accept. You cannot edit after
            sending.
          </p>
          <form action={requestJob} className="space-y-3">
            <input
              name="name"
              required
              placeholder="Job name"
              className="w-full border rounded-lg px-3 py-3 text-base"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-neutral-600 block">
                Job start
                <input
                  type="datetime-local"
                  name="jobStart"
                  className="mt-1 w-full border rounded-lg px-3 py-3 text-base"
                />
              </label>
              <label className="text-sm text-neutral-600 block">
                Job end
                <input
                  type="datetime-local"
                  name="jobEnd"
                  className="mt-1 w-full border rounded-lg px-3 py-3 text-base"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="clientPocName"
                placeholder="On-site contact name"
                className="w-full border rounded-lg px-3 py-3 text-base"
              />
              <input
                name="clientPocPhone"
                type="tel"
                placeholder="On-site contact phone"
                className="w-full border rounded-lg px-3 py-3 text-base"
              />
            </div>
            <textarea
              name="notes"
              rows={3}
              placeholder="Details for the team"
              className="w-full border rounded-lg px-3 py-3 text-base"
            />
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg px-4 py-3 text-base font-medium bg-neutral-900 text-white min-h-[48px]"
            >
              Submit request
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
