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
    case "denied":
      return "bg-red-100 text-red-900";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track status for {company?.name ?? "your company"}. Submit a new
          request when you need one.
        </p>
      </div>

      {!company ? (
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-800">
            Your jobs
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({jobList.length})
            </span>
          </h2>

          {jobList.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4">
              No jobs yet. Use + New request below when you need one.
            </p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[420px] text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium">Name</th>
                    <th className="py-2 px-3 font-medium w-[6rem]">Date</th>
                    <th className="py-2 px-3 font-medium w-[7rem]">Status</th>
                    <th className="py-2 px-3 font-medium w-[4rem] text-right">
                      {" "}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobList.map((job) => {
                    const when = fmtShort(job.jobStart);
                    return (
                      <tr
                        key={job.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                      >
                        <td className="py-2 px-3 font-medium text-neutral-900">
                          <Link
                            href={`/portal/jobs/${job.id}`}
                            className="hover:underline"
                          >
                            {job.name}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-neutral-600">
                          {when ?? "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${statusClass(job.status)}`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Link
                            href={`/portal/jobs/${job.id}`}
                            className="text-xs text-neutral-400 hover:text-neutral-700"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
                New request
              </span>
            </summary>
            <div className="mt-3 max-w-xl space-y-3">
              <p className="text-xs text-neutral-500">
                Submits as a draft for the team to accept or deny. You cannot
                edit after sending.
              </p>
              <form action={requestJob} className="space-y-3">
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
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-neutral-500">
                    On-site contact name
                    <input
                      name="clientPocName"
                      placeholder="Name"
                      className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-neutral-500">
                    On-site contact phone
                    <input
                      name="clientPocPhone"
                      type="tel"
                      placeholder="Phone"
                      className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-xs text-neutral-500">
                  Details for the team
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Notes"
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
                >
                  Submit request
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
