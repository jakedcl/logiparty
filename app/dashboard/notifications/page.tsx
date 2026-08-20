import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptDraftJob, denyDraftJob } from "@/lib/actions/jobs";
import {
  approveInventoryRequest,
  denyInventoryRequest,
} from "@/lib/actions/inventory-requests";
import { listNotifications } from "@/lib/actions/notifications";
import {
  canManageClientInventory,
  canManageJobs,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

function fmt(d: Date): string {
  return d.toLocaleString();
}

function kindLabel(
  kind: "draft_request" | "inventory_request" | "assignment"
): string {
  switch (kind) {
    case "draft_request":
      return "Job request";
    case "inventory_request":
      return "Inventory";
    case "assignment":
      return "Assignment";
  }
}

export default async function NotificationsPage() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  const canManager = canManageJobs(session.user);
  const canStaff = canViewMyJobs(session.user);
  const canInventory = canManageClientInventory(session.user, tags);
  if (!canManager && !canStaff && !canInventory) redirect("/dashboard");

  const items = await listNotifications(session.user.orgId);
  const showActions = canManager || canInventory;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Notifications</h1>
        <p className="text-sm text-neutral-500">
          {[
            canManager ? "draft job requests" : null,
            canInventory ? "inventory change requests" : null,
            canStaff ? "your assignments" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase()) || "Inbox"}
          .
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
                  {showActions ? (
                    <th className="py-2 px-3 font-medium w-[10rem] text-right">
                      {" "}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const draftJobId =
                    item.kind === "draft_request"
                      ? item.id.replace(/^draft:/, "")
                      : null;
                  const invId =
                    item.kind === "inventory_request"
                      ? item.inventoryRequestId
                      : null;
                  return (
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
                      {showActions ? (
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          {draftJobId && canManager ? (
                            <div className="inline-flex items-center gap-2">
                              <form action={acceptDraftJob}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={draftJobId}
                                />
                                <button
                                  type="submit"
                                  className="text-xs font-medium text-neutral-900 hover:underline"
                                >
                                  Accept
                                </button>
                              </form>
                              <form action={denyDraftJob}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={draftJobId}
                                />
                                <ConfirmSubmitButton
                                  message="Deny this client job request? They will see it as denied."
                                  className="text-xs font-medium text-red-600 hover:underline"
                                >
                                  Deny
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          ) : invId && canInventory ? (
                            <div className="inline-flex items-center gap-2">
                              <form action={approveInventoryRequest}>
                                <input type="hidden" name="id" value={invId} />
                                <button
                                  type="submit"
                                  className="text-xs font-medium text-neutral-900 hover:underline"
                                >
                                  Approve
                                </button>
                              </form>
                              <form action={denyInventoryRequest}>
                                <input type="hidden" name="id" value={invId} />
                                <ConfirmSubmitButton
                                  message="Deny this inventory request? The client will see it as denied."
                                  className="text-xs font-medium text-red-600 hover:underline"
                                >
                                  Deny
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className="text-xs text-neutral-400 hover:text-neutral-700"
                            >
                              View →
                            </Link>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
