import Link from "next/link";
import { redirect } from "next/navigation";
import { canViewMyJobs } from "@/lib/auth/permissions";
import { listMyJobs } from "@/lib/actions/my-jobs";
import { requireSession } from "@/lib/org/context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function MyJobsPage() {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) redirect("/dashboard");

  const jobs = await listMyJobs(session.user.orgId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Jobs"
        description="Jobs where you have a load-in or load-out assignment."
      />

      {jobs.length === 0 ? (
        <p className="app-empty">
          No assigned jobs yet. A manager will add you to a crew.
        </p>
      ) : (
        <div className="app-table-wrap -mx-4 sm:mx-0">
          <table className="app-table min-w-[480px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th className="w-[7rem]">Status</th>
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
