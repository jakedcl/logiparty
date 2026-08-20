import { redirect } from "next/navigation";
import { AddOrgInventoryItemPanel } from "@/components/org-inventory/add-item-panel";
import { OrgInventoryItemsTable } from "@/components/org-inventory/items-table";
import { canManageOrgInventory } from "@/lib/auth/permissions";
import { listOrgInventoryItems } from "@/lib/actions/inventory";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export default async function OrgInventoryPage() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageOrgInventory(session.user, tags)) redirect("/dashboard");

  const items = await listOrgInventoryItems(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Our inventory</h1>
        <p className="text-sm text-neutral-500">
          Gear your company owns (dollies, machines, general stock). Not client
          assets or fleet.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Items
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({items.length})
            </span>
          </h2>
        </div>

        <OrgInventoryItemsTable items={items} />
        <AddOrgInventoryItemPanel />
      </section>
    </div>
  );
}
