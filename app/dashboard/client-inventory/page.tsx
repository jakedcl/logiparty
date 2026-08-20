import Link from "next/link";
import { redirect } from "next/navigation";
import { AddItemPanel } from "@/components/client-inventory/add-item-panel";
import { ClientInventoryItemsTable } from "@/components/client-inventory/items-table";
import { canManageClientInventory } from "@/lib/auth/permissions";
import {
  listClientCompaniesForOrg,
  listClientInventoryItems,
} from "@/lib/actions/client-inventory";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export default async function ClientInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageClientInventory(session.user, tags)) redirect("/dashboard");

  const { companyId } = await searchParams;
  const companies = await listClientCompaniesForOrg(session.user.orgId);
  const selectedId =
    companyId && companies.some((c) => c.id === companyId) ? companyId : "";
  const items = selectedId
    ? await listClientInventoryItems(session.user.orgId, selectedId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Client inventory</h1>
        <p className="text-sm text-neutral-500">
          Assets owned by a client company and stored in your warehouse. Filter
          by company — clients only see their own catalog in the portal.
        </p>
      </div>

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

      {selectedId && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-neutral-800">
              Items
              <span className="ml-1.5 text-neutral-400 font-normal">
                ({items.length})
              </span>
            </h2>
          </div>

          <ClientInventoryItemsTable
            items={items}
            clientCompanyId={selectedId}
          />

          <AddItemPanel clientCompanyId={selectedId} />
        </section>
      )}
    </div>
  );
}
