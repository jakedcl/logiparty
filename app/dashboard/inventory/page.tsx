import Link from "next/link";
import { redirect } from "next/navigation";
import { AddItemPanel } from "@/components/client-inventory/add-item-panel";
import { ClientCompanyTitleSelect } from "@/components/client-inventory/client-company-title-select";
import { ClientInventoryItemsTable } from "@/components/client-inventory/items-table";
import { ClientInventoryTitleRow } from "@/components/client-inventory/pending-requests-chrome";
import { AddFleetVehiclePanel } from "@/components/fleet/add-vehicle-panel";
import { FleetVehiclesTable } from "@/components/fleet/vehicles-table";
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
  canViewFleet,
} from "@/lib/auth/permissions";
import {
  inventoryHref,
  parseInventoryTab,
  resolveCompanyIdParam,
  type InventoryTab,
} from "@/lib/inventory/hub";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export default async function InventoryHubPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    companyId?: string;
    clientId?: string;
    client?: string;
  }>;
}) {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  const showClient = canManageClientInventory(session.user, tags);
  const showEquipment = canManageOrgInventory(session.user, tags);
  const showFleet = canViewFleet(session.user);
  const canEditFleet = canManageFleet(session.user);

  const allowed: InventoryTab[] = [];
  if (showClient) allowed.push("client");
  if (showEquipment) allowed.push("equipment");
  if (showFleet) allowed.push("fleet");
  if (allowed.length === 0) redirect("/dashboard");

  const params = await searchParams;
  const tab = parseInventoryTab(params.tab, allowed);
  const companyParam = resolveCompanyIdParam(params);

  let companies: Awaited<ReturnType<typeof listClientCompaniesForOrg>> = [];
  let selectedId = "";
  let clientItems: Awaited<ReturnType<typeof listClientInventoryItems>> = [];
  let pending: Awaited<ReturnType<typeof listPendingInventoryRequests>> = [];
  let equipmentItems: Awaited<ReturnType<typeof listOrgInventoryItems>> = [];
  let vehicles: Awaited<ReturnType<typeof listFleetVehicles>> = [];

  if (tab === "client") {
    companies = await listClientCompaniesForOrg(session.user.orgId);
    const requestedId =
      companyParam && companies.some((c) => c.id === companyParam)
        ? companyParam
        : "";
    // Default to first client so the table is the main event immediately
    if (!requestedId && companies.length > 0) {
      redirect(
        inventoryHref({ tab: "client", companyId: companies[0].id })
      );
    }
    selectedId = requestedId;
    if (selectedId) {
      const [items, scopedPending] = await Promise.all([
        listClientInventoryItems(session.user.orgId, selectedId),
        listPendingInventoryRequests(session.user.orgId, selectedId),
      ]);
      clientItems = items;
      pending = scopedPending;
    }
  } else if (tab === "equipment") {
    equipmentItems = await listOrgInventoryItems(session.user.orgId);
  } else {
    vehicles = await listFleetVehicles(session.user.orgId);
  }

  const header =
    tab === "client"
      ? {
          title: "Client",
          description: "Client-owned assets stored at your sites.",
        }
      : tab === "equipment"
        ? {
            title: "Equipment",
            description:
              "Gear your company owns (dollies, machines, general stock).",
          }
        : {
            title: "Fleet",
            description:
              "Box trucks, vans, and other vehicles assigned to jobs.",
          };

  return (
    <div className="space-y-5">
      <PageHeader title={header.title} description={header.description} />

      {tab === "client" ? (

        <div className="space-y-5">
          {companies.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Add a{" "}
              <Link href="/dashboard/clients" className="app-link">
                client company
              </Link>{" "}
              first.
            </p>
          ) : selectedId ? (
            <>
              <ClientInventoryTitleRow
                title={
                  <ClientCompanyTitleSelect
                    companies={companies}
                    selectedId={selectedId}
                  />
                }
                requests={pending}
              />

              <div className="space-y-3">
                <AddItemPanel
                  clientCompanyId={selectedId}
                  caption={`Client-owned assets stored at your sites · ${clientItems.length} item${clientItems.length === 1 ? "" : "s"}`}
                />
                <ClientInventoryItemsTable
                  items={clientItems}
                  clientCompanyId={selectedId}
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "equipment" ? (
        <div className="space-y-3">
          <AddOrgInventoryItemPanel caption="Gear your company owns (dollies, machines, general stock)." />
          <OrgInventoryItemsTable items={equipmentItems} />
        </div>
      ) : null}

      {tab === "fleet" ? (
        <div className="space-y-3">
          <AddFleetVehiclePanel
            caption="Box trucks, vans, and other vehicles assigned to jobs."
            canAdd={canEditFleet}
          />
          <FleetVehiclesTable vehicles={vehicles} canEdit={canEditFleet} />
        </div>
      ) : null}
    </div>
  );
}
