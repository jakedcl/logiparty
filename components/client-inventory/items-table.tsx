import {
  deleteClientInventoryItem,
  updateClientInventoryItem,
} from "@/lib/actions/client-inventory";
import type { ClientInventoryItem } from "@/lib/db/schema";

export function ClientInventoryItemsTable({
  items,
  clientCompanyId,
}: {
  items: ClientInventoryItem[];
  clientCompanyId: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No inventory for this client yet. Use + Add item below when you need a
        new SKU.
      </p>
    );
  }

  return (
    <div className="lp-table-wrap">
      <table className="lp-table min-w-[640px]">
        <thead>
          <tr>
            <th className="py-2 px-3 font-medium w-[7.5rem]">SKU</th>
            <th className="py-2 px-3 font-medium w-[10rem]">Name</th>
            <th className="py-2 px-3 font-medium">Description</th>
            <th className="py-2 px-3 font-medium w-[5.5rem]">Qty</th>
            <th className="py-2 px-3 font-medium w-[7.5rem] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const formId = `client-inv-${item.id}`;
            return (
              <tr key={item.id} className="align-middle">
                <td className="py-1.5 px-3 font-mono text-xs text-neutral-700 whitespace-nowrap">
                  {item.sku}
                  <input type="hidden" form={formId} name="sku" value={item.sku} />
                </td>
                <td className="py-1.5 px-3 text-neutral-900">
                  {item.name}
                  <input
                    type="hidden"
                    form={formId}
                    name="name"
                    value={item.name}
                  />
                </td>
                <td className="py-1.5 px-3">
                  <input
                    form={formId}
                    name="description"
                    defaultValue={item.description ?? ""}
                    placeholder="—"
                    className="w-full min-w-[8rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white"
                  />
                </td>
                <td className="py-1.5 px-3">
                  <input
                    form={formId}
                    name="totalQuantity"
                    type="number"
                    min={0}
                    required
                    defaultValue={item.totalQuantity}
                    className="w-full max-w-[5rem] border border-neutral-200 rounded px-1.5 py-1 text-sm tabular-nums"
                  />
                </td>
                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                  <form
                    id={formId}
                    action={updateClientInventoryItem}
                    className="inline"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="clientCompanyId"
                      value={clientCompanyId}
                    />
                    <button
                      type="submit"
                      className="text-sm text-neutral-700 hover:text-neutral-900 font-medium mr-3"
                    >
                      Save
                    </button>
                  </form>
                  <form action={deleteClientInventoryItem} className="inline">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="clientCompanyId"
                      value={clientCompanyId}
                    />
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
  );
}
