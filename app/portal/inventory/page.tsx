import { ChevronDown } from "lucide-react";
import {
  listClientInventoryItems,
} from "@/lib/actions/client-inventory";
import { listPortalInventoryRequests } from "@/lib/actions/inventory-requests";
import {
  PortalInventoryItemsTable,
  PortalInventoryRequestsList,
  PortalRequestNewItemLink,
} from "@/components/portal/inventory-requests";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

export default async function PortalInventoryPage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const items =
    company ?
      await listClientInventoryItems(session.user.orgId, company.id)
    : [];
  const requests =
    company ?
      await listPortalInventoryRequests(session.user.orgId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Items stored with {session.user.orgName} for{" "}
          {company?.name ?? "your company"}. Request changes — the warehouse
          team reviews before the catalog updates.
        </p>
      </div>

      {!company ? (
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-neutral-800">
              Your items
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({items.length})
              </span>
            </h2>
            <PortalInventoryItemsTable items={items} />
            <PortalRequestNewItemLink />
          </section>

          <details className="group">
            <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800">
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
                  strokeWidth={1.75}
                  aria-hidden
                />
                Your requests
                <span className="text-neutral-400 font-normal">
                  ({requests.length})
                </span>
              </span>
            </summary>
            <div className="mt-3">
              <PortalInventoryRequestsList requests={requests} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
