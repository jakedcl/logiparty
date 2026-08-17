import Link from "next/link";
import { redirect } from "next/navigation";
import { canViewMyJobs } from "@/lib/auth/permissions";
import { listMyJobs } from "@/lib/actions/my-jobs";
import { requireSession } from "@/lib/org/context";

export default async function MyJobsPage() {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) redirect("/dashboard");

  const jobs = await listMyJobs(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">My Jobs</h1>
        <p className="text-sm text-neutral-500">
          Jobs where you have a load-in or load-out assignment.
        </p>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No assigned jobs yet. A manager will add you to a crew.
        </p>
      ) : (
        <ul className="divide-y border rounded">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/dashboard/my-jobs/${job.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-sm">{job.name}</p>
                  <p className="text-xs text-neutral-500">
                    {job.clientCompanyName} ·{" "}
                    <span className="capitalize">{job.status}</span>
                    {job.phases.length
                      ? ` · ${job.phases.join(", ")}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-neutral-400">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
