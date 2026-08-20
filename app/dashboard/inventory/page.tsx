import Link from "next/link";
import { redirect } from "next/navigation";
import { AddItemPanel } from "@/components/client-inventory/add-item-panel";
import { ClientInventoryItemsTable } from "@/components/client-inventory/items-table";
import { PendingInventoryRequestsPanel } from "@/components/client-inventory/pending-requests";
import { AddFleetVehiclePanel } from "@/components/fleet/add-vehicle-panel";
import { FleetVehiclesTable } from "@/components/fleet/vehicles-table";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { AddOrgInventoryItemPanel } from "@/components/org-inventory/add-item-panel";
import { OrgInventoryItemsTable } from "@/components/org-inventory/items-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  listClientCompaniesForOrg,
  listClientInventoryItems,
} from "@/lib/actions/client-inventory";
import { listFleetVehicles } from "@/lib/actions/fleet";
import { listOrgInventoryItems } from "@/lib/actions/inventory";
import { listPendingInventoryRequests } from "@/lib/actions/inventory-requests";
import {
  canManageClientInventory,
  canManageFleet,
  canManageOrgInventory,
} from "@/lib/auth/permissions";
import {
  parseInventoryTab,
  type InventoryTab,
} from "@/lib/inventory/hub";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export default async function InventoryHubPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    companyId?: string;
  }>;
}) {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  const showClient = canManageClientInventory(session.user, tags);
  const showEquipment = canManageOrgInventory(session.user, tags);
  const showFleet = canManageFleet(session.user);

  const allowed: InventoryTab[] = [];
  if (showClient) allowed.push("client");
  if (showEquipment) allowed.push("equipment");
  if (showFleet) allowed.push("fleet");
  if (allowed.length === 0) redirect("/dashboard");

  const params = await searchParams;
  const tab = parseInventoryTab(params.tab, allowed);

  let companies: Awaited<ReturnType<typeof listClientCompaniesForOrg>> = [];
  let selectedId = "";
  let clientItems: Awaited<ReturnType<typeof listClientInventoryItems>> = [];
  let pending: Awaited<ReturnType<typeof listPendingInventoryRequests>> = [];
  let equipmentItems: Awaited<ReturnType<typeof listOrgInventoryItems>> = [];
  let vehicles: Awaited<ReturnType<typeof listFleetVehicles>> = [];

  if (tab === "client") {
    companies = await listClientCompaniesForOrg(session.user.orgId);
    selectedId =
      params.companyId && companies.some((c) => c.id === params.companyId)
        ? params.companyId
        : "";
    clientItems = selectedId
      ? await listClientInventoryItems(session.user.orgId, selectedId)
      : [];
    pending = await listPendingInventoryRequests(session.user.orgId);
  } else if (tab === "equipment") {
    equipmentItems = await listOrgInventoryItems(session.user.orgId);
  } else {
    vehicles = await listFleetVehicles(session.user.orgId);
  }

  const tabCopy =
    tab === "client"
      ? "Client-owned assets stored at your sites. Clients request changes in the portal."
      : tab === "equipment"
        ? "Gear your company owns (dollies, machines, general stock)."
        : "Box trucks, vans, and other vehicles assigned to jobs.";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Client assets, your equipment, and fleet — one place."
      />

      <InventoryTabs
        tab={tab}
        companyId={selectedId || undefined}
        allowed={allowed}
      />

      <p className="text-sm text-neutral-500">{tabCopy}</p>

      {tab === "client" ? (
        <div className="space-y-5">
          {pending.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-800">
                Pending requests
                <span className="ml-1.5 text-neutral-400 font-normal">
                  ({pending.length})
                </span>
              </h2>
              <PendingInventoryRequestsPanel requests={pending} />
            </section>
          ) : null}

          {companies.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Add a{" "}
              <Link href="/dashboard/clients" className="underline">
                client company
              </Link>{" "}
              first.
            </p>
          ) : (
            <form method="get" className="flex flex-wrap gap-2 items-end max-w-xl">
              <input type="hidden" name="tab" value="client" />
              <label className="flex-1 text-sm text-neutral-600 min-w-[200px]">
                Client company
                <select
                  name="companyId"
                  defaultValue={selectedId}
                  required
                  className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white h-[42px]"
              >
                Filter
              </button>
            </form>
          )}

          {selectedId ? (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium text-neutral-800">
                  Items
                  <span className="ml-1.5 text-neutral-400 font-normal">
                    ({clientItems.length})
                  </span>
                </h2>
              </div>
              <ClientInventoryItemsTable
                items={clientItems}
                clientCompanyId={selectedId}
              />
              <AddItemPanel clientCompanyId={selectedId} />
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "equipment" ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-neutral-800">
              Items
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({equipmentItems.length})
              </span>
            </h2>
          </div>
          <OrgInventoryItemsTable items={equipmentItems} />
          <AddOrgInventoryItemPanel />
        </section>
      ) : null}

      {tab === "fleet" ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-neutral-800">
              Vehicles
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({vehicles.length})
              </span>
            </h2>
          </div>
          <FleetVehiclesTable vehicles={vehicles} />
          <AddFleetVehiclePanel />
        </section>
      ) : null}
    </div>
  );
}
