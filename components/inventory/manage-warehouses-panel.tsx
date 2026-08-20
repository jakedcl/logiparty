import {
  createWarehouse,
  deleteWarehouse,
  updateWarehouse,
} from "@/lib/actions/warehouses";
import type { Warehouse } from "@/lib/db/schema";

export function ManageWarehousesPanel({
  warehouses,
}: {
  warehouses: Warehouse[];
}) {
  return (
    <details className="group border-t border-neutral-200 pt-4">
      <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-neutral-400 group-open:hidden" aria-hidden>
            +
          </span>
          <span className="hidden text-neutral-400 group-open:inline" aria-hidden>
            −
          </span>
          Manage locations
        </span>
        <span className="ml-1.5 text-neutral-400 font-normal">
          ({warehouses.length})
        </span>
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-xs text-neutral-500 max-w-xl">
          Storage sites for your org. Filter Inventory by location above; assign
          items and vehicles to a site from each row.
        </p>

        {warehouses.length === 0 ? (
          <p className="text-sm text-neutral-500">No locations yet.</p>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table min-w-[520px]">
              <thead>
                <tr>
                  <th className="py-2 px-3 font-medium w-[10rem]">Name</th>
                  <th className="py-2 px-3 font-medium">Address</th>
                  <th className="py-2 px-3 font-medium w-[4.5rem]">Active</th>
                  <th className="py-2 px-3 font-medium w-[7.5rem] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => {
                  const formId = `wh-${w.id}`;
                  return (
                    <tr key={w.id} className="align-middle">
                      <td className="py-1.5 px-3">
                        <input
                          form={formId}
                          name="name"
                          required
                          defaultValue={w.name}
                          className="w-full min-w-[6rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          form={formId}
                          name="address"
                          defaultValue={w.address ?? ""}
                          placeholder="—"
                          className="w-full min-w-[8rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <input
                          form={formId}
                          type="checkbox"
                          name="isActive"
                          defaultChecked={w.isActive}
                          className="rounded"
                          aria-label="Active"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
                        <form
                          id={formId}
                          action={updateWarehouse}
                          className="inline"
                        >
                          <input type="hidden" name="id" value={w.id} />
                          <button
                            type="submit"
                            className="text-sm text-neutral-700 hover:text-neutral-900 font-medium mr-3"
                          >
                            Save
                          </button>
                        </form>
                        <form action={deleteWarehouse} className="inline">
                          <input type="hidden" name="id" value={w.id} />
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form
          action={createWarehouse}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <label className="text-xs text-neutral-500 lg:col-span-1">
            Name
            <input
              name="name"
              required
              placeholder="e.g. Bushwick Warehouse"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-500 sm:col-span-2 lg:col-span-2">
            Address
            <input
              name="address"
              placeholder="Optional"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px] mt-5 lg:mt-0"
          >
            Add location
          </button>
        </form>
      </div>
    </details>
  );
}
