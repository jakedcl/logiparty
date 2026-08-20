import Link from "next/link";
import { redirect } from "next/navigation";
import { listNotifications } from "@/lib/actions/notifications";
import {
  canManageJobs,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

function fmt(d: Date): string {
  return d.toLocaleString();
}

function kindLabel(kind: "draft_request" | "assignment"): string {
  return kind === "draft_request" ? "Request" : "Assignment";
}

export default async function NotificationsPage() {
  const session = await requireSession();
  const canManager = canManageJobs(session.user);
  const canStaff = canViewMyJobs(session.user);
  if (!canManager && !canStaff) redirect("/dashboard");

  const items = await listNotifications(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Notifications</h1>
        <p className="text-sm text-neutral-500">
          {canManager && canStaff
            ? "Draft job requests needing attention, and jobs you are assigned to."
            : canManager
              ? "Client portal job requests waiting for review."
              : "Jobs you have been assigned to."}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-800">
          Inbox
          <span className="ml-1.5 text-neutral-400 font-normal">
            ({items.length})
          </span>
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">Nothing new right now.</p>
        ) : (
          <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[520px] text-sm text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                  <th className="py-2 px-3 font-medium w-[6.5rem]">Type</th>
                  <th className="py-2 px-3 font-medium">Item</th>
                  <th className="py-2 px-3 font-medium w-[9rem] text-right">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                      {kindLabel(item.kind)}
                    </td>
                    <td className="py-2 px-3">
                      <Link
                        href={item.href}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-neutral-500 text-xs mt-0.5">
                        {item.detail}
                      </p>
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-neutral-400 whitespace-nowrap">
                      <time>{fmt(item.createdAt)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
