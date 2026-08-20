import Link from "next/link";
import { requestJob, listPortalJobs } from "@/lib/actions/portal-jobs";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

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
    <div className="space-y-8">
      <PageHeader
        title="Jobs"
        description={`Track status for ${company?.name ?? "your company"}. Submit a new request when you need one.`}
      />

      {!company ? (
        <p className="app-empty">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="lp-section-title">
            Your jobs
            <span className="lp-section-meta">({jobList.length})</span>
          </h2>

          {jobList.length === 0 ? (
            <p className="app-empty">
              No jobs yet. Use + New request below when you need one.
            </p>
          ) : (
            <div className="lp-table-wrap">
              <table className="lp-table min-w-[420px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="w-[6rem]">Date</th>
                    <th className="w-[7rem]">Status</th>
                    <th className="w-[4rem] text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {jobList.map((job) => {
                    const when = fmtShort(job.jobStart);
                    return (
                      <tr key={job.id}>
                        <td>
                          <Link
                            href={`/portal/jobs/${job.id}`}
                            className="lp-cell-strong hover:underline"
                          >
                            {job.name}
                          </Link>
                        </td>
                        <td>{when ?? "—"}</td>
                        <td>
                          <StatusBadge status={job.status} kind="job" />
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/portal/jobs/${job.id}`}
                            className="lp-link-quiet"
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

          <details className="group border-t border-[var(--border)] pt-4">
            <summary className="cursor-pointer list-none text-sm text-[var(--muted)] hover:text-[var(--foreground)] select-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="text-[var(--faint)] group-open:hidden" aria-hidden>
                  +
                </span>
                <span
                  className="hidden text-[var(--faint)] group-open:inline"
                  aria-hidden
                >
                  −
                </span>
                New request
              </span>
            </summary>
            <div className="mt-3 max-w-xl space-y-3">
              <p className="text-xs text-[var(--muted)]">
                Submits as a draft for the team to accept or deny. You cannot
                edit after sending.
              </p>
              <form action={requestJob} className="space-y-3">
                <label className="app-label">
                  Job name
                  <input
                    name="name"
                    required
                    placeholder="Job name"
                    className="lp-input mt-1"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="app-label">
                    Job start
                    <input
                      type="datetime-local"
                      name="jobStart"
                      className="lp-input mt-1"
                    />
                  </label>
                  <label className="app-label">
                    Job end
                    <input
                      type="datetime-local"
                      name="jobEnd"
                      className="lp-input mt-1"
                    />
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="app-label">
                    On-site contact name
                    <input
                      name="clientPocName"
                      placeholder="Name"
                      className="lp-input mt-1"
                    />
                  </label>
                  <label className="app-label">
                    On-site contact phone
                    <input
                      name="clientPocPhone"
                      type="tel"
                      placeholder="Phone"
                      className="lp-input mt-1"
                    />
                  </label>
                </div>
                <label className="app-label">
                  Details for the team
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Notes"
                    className="lp-input mt-1"
                  />
                </label>
                <button type="submit" className="lp-btn">
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
