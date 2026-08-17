import Link from "next/link";
import { redirect } from "next/navigation";
import { listActivityLogs } from "@/lib/actions/activity-log";
import { canManageJobs } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

function fmt(d: Date): string {
  return d.toLocaleString();
}

export default async function ActivityLogPage() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const logs = await listActivityLogs(session.user.orgId);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-2 mb-1">Activity log</h1>
        <p className="text-sm text-neutral-500">
          Recent actions in your organization. Managers only.
        </p>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-neutral-500">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y border rounded-lg bg-white text-sm">
          {logs.map((entry) => (
            <li key={entry.id} className="px-4 py-3 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{entry.action}</p>
                <time className="text-xs text-neutral-400 shrink-0">
                  {fmt(entry.createdAt)}
                </time>
              </div>
              <p className="text-xs text-neutral-500">
                {entry.actorLabel}
                {entry.jobName && entry.jobId ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={`/dashboard/jobs/${entry.jobId}`}
                      className="underline hover:text-neutral-800"
                    >
                      {entry.jobName}
                    </Link>
                  </>
                ) : null}
                {entry.entityType ? (
                  <span className="text-neutral-400"> · {entry.entityType}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
