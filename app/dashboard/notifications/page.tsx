import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptDraftJob, denyDraftJob } from "@/lib/actions/jobs";
import { markClientNoteRead } from "@/lib/actions/client-notes";
import {
  approveInventoryRequest,
  denyInventoryRequest,
} from "@/lib/actions/inventory-requests";
import {
  listNotifications,
  listRejectedItems,
} from "@/lib/actions/notifications";
import {
  canManageClientInventory,
  canManageJobs,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

function fmt(d: Date): string {
  return d.toLocaleString();
}

function kindLabel(
  kind: "draft_request" | "inventory_request" | "client_note" | "assignment"
): string {
  switch (kind) {
    case "draft_request":
      return "Job request";
    case "inventory_request":
      return "Inventory";
    case "client_note":
      return "Note";
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
  const rejected =
    canManager || canInventory
      ? await listRejectedItems(session.user.orgId).catch(() => [])
      : [];
  const showActions = canManager || canInventory;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description={
          ([
            canManager ? "draft job requests" : null,
            canManager ? "client notes" : null,
            canInventory ? "inventory change requests" : null,
            canStaff ? "your assignments" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase()) || "Inbox") + "."
        }
      />

      <section className="space-y-3">
        <h2 className="lp-section-title">
          Inbox
          <span className="lp-section-meta">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <p className="app-empty">Nothing new right now.</p>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table min-w-[520px]">
              <thead>
                <tr>
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
                  const noteId =
                    item.kind === "client_note" ? item.clientNoteId : null;
                  return (
                    <tr key={item.id}>
                      <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                        {kindLabel(item.kind)}
                      </td>
                      <td className="py-2 px-3">
                        {item.kind === "client_note" ? (
                          <>
                            <p className="font-medium text-neutral-900">
                              {item.title}
                            </p>
                            <p className="text-neutral-500 text-xs mt-0.5">
                              {item.detail}
                            </p>
                          </>
                        ) : (
                          <>
                            <Link
                              href={item.href}
                              className="font-medium text-neutral-900 hover:underline"
                            >
                              {item.title}
                            </Link>
                            <p className="text-neutral-500 text-xs mt-0.5">
                              {item.detail}
                            </p>
                          </>
                        )}
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
                          ) : noteId && canManager ? (
                            <form action={markClientNoteRead}>
                              <input type="hidden" name="id" value={noteId} />
                              <button
                                type="submit"
                                className="text-xs font-medium text-neutral-900 hover:underline"
                              >
                                Mark read
                              </button>
                            </form>
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

      {rejected.length > 0 ? (
        <details className="group border-t border-[var(--border)] pt-6">
          <summary className="cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
            <span className="lp-section-title inline-flex items-center gap-1.5">
              <span className="text-[var(--faint)] group-open:hidden" aria-hidden>
                +
              </span>
              <span
                className="hidden text-[var(--faint)] group-open:inline"
                aria-hidden
              >
                −
              </span>
              Rejected
              <span className="lp-section-meta">({rejected.length})</span>
            </span>
          </summary>
          <div className="mt-3 lp-table-wrap">
            <table className="lp-table min-w-[480px]">
              <thead>
                <tr>
                  <th className="py-2 px-3 font-medium w-[6.5rem]">Type</th>
                  <th className="py-2 px-3 font-medium">Item</th>
                  <th className="py-2 px-3 font-medium w-[9rem] text-right">
                    When
                  </th>
                  <th className="py-2 px-3 font-medium w-[4rem] text-right">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                      {kindLabel(item.kind)}
                    </td>
                    <td className="py-2 px-3">
                      <p className="font-medium text-neutral-700">{item.title}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">
                        {item.detail}
                      </p>
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-neutral-400 whitespace-nowrap">
                      <time>{fmt(item.createdAt)}</time>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={item.href}
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
        </details>
      ) : null}
    </div>
  );
}
