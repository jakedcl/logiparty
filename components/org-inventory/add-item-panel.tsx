import { SkuInput } from "@/components/client-inventory/sku-input";
import { WarehouseSelect } from "@/components/inventory/warehouse-select";
import { createOrgInventoryItem } from "@/lib/actions/inventory";
import type { Warehouse } from "@/lib/db/schema";

export function AddOrgInventoryItemPanel({
  warehouses,
  returnLocation,
  defaultWarehouseId,
}: {
  warehouses: Warehouse[];
  returnLocation?: string;
  defaultWarehouseId?: string | null;
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
          Add item
        </span>
      </summary>
      <form
        action={createOrgInventoryItem}
        className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-7 lg:items-end"
      >
        {returnLocation ? (
          <input type="hidden" name="returnLocation" value={returnLocation} />
        ) : null}
        <label className="text-xs text-neutral-500 lg:col-span-1">
          SKU
          <SkuInput
            required
            className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm font-mono uppercase"
          />
        </label>
        <label className="text-xs text-neutral-500 lg:col-span-1">
          Name
          <input
            name="name"
            required
            placeholder="Name"
            className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-500 sm:col-span-2 lg:col-span-2">
          Description
          <input
            name="description"
            placeholder="Optional"
            className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-500 lg:col-span-1">
          Qty
          <input
            name="totalQuantity"
            type="number"
            min={0}
            required
            defaultValue={0}
            className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-500 lg:col-span-1">
          Location
          <div className="mt-1">
            <WarehouseSelect
              warehouses={warehouses}
              defaultValue={defaultWarehouseId}
              className="w-full border border-neutral-200 rounded px-2 py-1.5 text-sm bg-white"
            />
          </div>
        </label>
        <button
          type="submit"
          className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px] mt-5 lg:mt-0"
        >
          Add
        </button>
      </form>
    </details>
  );
}
