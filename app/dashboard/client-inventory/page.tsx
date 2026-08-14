import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageClientInventory } from "@/lib/auth/permissions";
import {
  createClientInventoryItem,
  deleteClientInventoryItem,
  listClientCompaniesForOrg,
  listClientInventoryItems,
  updateClientInventoryItem,
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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Client inventory</h1>
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
        <form method="get" className="flex flex-wrap gap-2 items-end max-w-2xl">
          <label className="flex-1 text-sm text-neutral-600 min-w-[200px]">
            Client company
            <select
              name="companyId"
              defaultValue={selectedId}
              required
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
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
        <>
          <section className="border rounded-lg p-4 bg-white max-w-2xl">
            <h2 className="font-medium mb-3">Add item</h2>
            <form action={createClientInventoryItem} className="space-y-2">
              <input type="hidden" name="clientCompanyId" value={selectedId} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="sku"
                  required
                  placeholder="SKU"
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  name="name"
                  required
                  placeholder="Name"
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <input
                name="description"
                placeholder="Description (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-2 items-end">
                <label className="flex-1 text-sm text-neutral-600">
                  Qty
                  <input
                    name="totalQuantity"
                    type="number"
                    min={0}
                    required
                    defaultValue={0}
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white h-[42px]"
                >
                  Add
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Items ({items.length})</h2>
            {items.length === 0 && (
              <p className="text-sm text-neutral-500">
                No inventory for this client yet.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 bg-white max-w-2xl space-y-3"
              >
                <form action={updateClientInventoryItem} className="space-y-2">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      name="sku"
                      required
                      defaultValue={item.sku}
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      name="name"
                      required
                      defaultValue={item.name}
                      className="border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    name="description"
                    defaultValue={item.description ?? ""}
                    placeholder="Description (optional)"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 items-end">
                    <label className="flex-1 text-sm text-neutral-600">
                      Qty
                      <input
                        name="totalQuantity"
                        type="number"
                        min={0}
                        required
                        defaultValue={item.totalQuantity}
                        className="mt-1 w-full border rounded px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded px-4 py-2 text-sm font-medium border border-neutral-300 h-[42px]"
                    >
                      Save
                    </button>
                  </div>
                </form>
                <form action={deleteClientInventoryItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
