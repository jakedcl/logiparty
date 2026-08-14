import { redirect } from "next/navigation";
import { canManageOrgInventory } from "@/lib/auth/permissions";
import {
  createOrgInventoryItem,
  deleteOrgInventoryItem,
  listOrgInventoryItems,
  updateOrgInventoryItem,
} from "@/lib/actions/inventory";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export default async function OrgInventoryPage() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageOrgInventory(session.user, tags)) redirect("/dashboard");

  const items = await listOrgInventoryItems(session.user.orgId);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Org inventory</h1>
        <p className="text-sm text-neutral-500">
          Gear your company owns (dollies, machines, general stock). Not client
          assets, fleet, or tools.
        </p>
      </div>

      <section className="border rounded-lg p-4 bg-white max-w-2xl">
        <h2 className="font-medium mb-3">Add item</h2>
        <form action={createOrgInventoryItem} className="space-y-2">
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
          <p className="text-sm text-neutral-500">No org inventory yet.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 bg-white max-w-2xl space-y-3"
          >
            <form action={updateOrgInventoryItem} className="space-y-2">
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
            <form action={deleteOrgInventoryItem}>
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
    </div>
  );
}
