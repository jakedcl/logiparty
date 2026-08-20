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

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-neutral-800">
              Your requests
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({requests.length})
              </span>
            </h2>
            <PortalInventoryRequestsList requests={requests} />
          </section>
        </>
      )}
    </div>
  );
}
