import Link from "next/link";
import { listActivityLogs } from "@/lib/actions/activity-log";

function fmt(d: Date): string {
  return d.toLocaleString();
}

type Props = {
  orgId: string;
};

export async function ActivityLogPanel({ orgId }: Props) {
  const logs = await listActivityLogs(orgId);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-neutral-800">
        Entries
        <span className="ml-1.5 text-neutral-400 font-normal">
          ({logs.length})
        </span>
      </h2>

      {logs.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">No activity recorded yet.</p>
      ) : (
        <div className="lp-table-wrap">
          <table className="lp-table min-w-[560px]">
            <thead>
              <tr>
                <th className="py-2 px-3 font-medium">Action</th>
                <th className="py-2 px-3 font-medium">Actor</th>
                <th className="py-2 px-3 font-medium">Context</th>
                <th className="py-2 px-3 font-medium w-[9rem] text-right">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-neutral-100 last:border-0 align-top hover:bg-neutral-50/80"
                >
                  <td className="py-2 px-3 font-medium text-neutral-900">
                    {entry.action}
                  </td>
                  <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                    {entry.actorLabel}
                  </td>
                  <td className="py-2 px-3 text-neutral-500">
                    {entry.jobName && entry.jobId ? (
                      <Link
                        href={`/dashboard/jobs/${entry.jobId}`}
                        className="underline hover:text-neutral-800"
                      >
                        {entry.jobName}
                      </Link>
                    ) : null}
                    {entry.entityType ? (
                      <span
                        className={
                          entry.jobName && entry.jobId
                            ? "text-neutral-400"
                            : undefined
                        }
                      >
                        {entry.jobName && entry.jobId ? " · " : null}
                        {entry.entityType}
                      </span>
                    ) : null}
                    {!entry.jobName && !entry.entityType ? "—" : null}
                  </td>
                  <td className="py-2 px-3 text-right text-xs text-neutral-400 whitespace-nowrap">
                    <time>{fmt(entry.createdAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
