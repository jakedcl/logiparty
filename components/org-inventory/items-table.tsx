"use client";

import { useState } from "react";
import {
  deleteOrgInventoryItem,
  updateOrgInventoryItem,
} from "@/lib/actions/inventory";
import type { InventoryItem } from "@/lib/db/schema";
import {
  RowActionItem,
  RowActionsMenu,
} from "@/components/ui/row-actions-menu";

function RowMenu({
  item,
  onEdit,
}: {
  item: InventoryItem;
  onEdit: () => void;
}) {
  return (
    <RowActionsMenu>
      <RowActionItem onClick={onEdit}>Edit</RowActionItem>
      <form action={deleteOrgInventoryItem}>
        <input type="hidden" name="id" value={item.id} />
        <RowActionItem type="submit" destructive>
          Delete
        </RowActionItem>
      </form>
    </RowActionsMenu>
  );
}

function ItemRow({ item }: { item: InventoryItem }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="align-middle bg-neutral-50/60">
        <td className="py-2 px-3 font-mono text-xs text-neutral-700 whitespace-nowrap">
          {item.sku}
        </td>
        <td colSpan={3} className="py-2 px-3">
          <form
            action={updateOrgInventoryItem}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="sku" value={item.sku} />
            <input type="hidden" name="name" value={item.name} />
            <label className="text-xs text-neutral-500 min-w-[10rem] flex-1">
              Description
              <input
                name="description"
                defaultValue={item.description ?? ""}
                placeholder="—"
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm bg-white"
              />
            </label>
            <label className="text-xs text-neutral-500 w-[5.5rem]">
              Qty
              <input
                name="totalQuantity"
                type="number"
                min={0}
                required
                defaultValue={item.totalQuantity}
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm tabular-nums bg-white"
              />
            </label>
            <button
              type="submit"
              className="rounded px-2.5 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded px-2.5 py-1.5 text-sm text-neutral-600 border border-neutral-300 h-[34px]"
            >
              Cancel
            </button>
          </form>
        </td>
        <td className="py-2 px-3" />
      </tr>
    );
  }

  return (
    <tr className="align-middle">
      <td className="py-2 px-3 font-mono text-xs text-neutral-700 whitespace-nowrap">
        {item.sku}
      </td>
      <td className="py-2 px-3 text-neutral-900">{item.name}</td>
      <td className="py-2 px-3 text-neutral-600">
        {item.description?.trim() ? item.description : "—"}
      </td>
      <td className="py-2 px-3 tabular-nums text-neutral-800">
        {item.totalQuantity}
      </td>
      <td className="py-2 px-3 text-right">
        <RowMenu item={item} onEdit={() => setEditing(true)} />
      </td>
    </tr>
  );
}

export function OrgInventoryItemsTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No equipment yet. Use + Add item above when you need a new SKU.
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
            <th className="py-2 px-3 font-medium w-[3.5rem] text-right" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
