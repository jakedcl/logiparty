"use client";

import { useState } from "react";
import { SkuInput } from "@/components/client-inventory/sku-input";
import { createOrgInventoryItem } from "@/lib/actions/inventory";

/** Caption left, + Add item right. Form opens below the row. */
export function AddOrgInventoryItemPanel({ caption }: { caption?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {caption ? (
          <p className="text-sm text-neutral-500 max-w-2xl pt-0.5">{caption}</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-sm font-medium text-neutral-900 hover:underline underline-offset-2"
        >
          {open ? "Cancel" : "+ Add item"}
        </button>
      </div>
      {open ? (
        <form
          action={createOrgInventoryItem}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-end border-t border-neutral-200 pt-3"
        >
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
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px] mt-5 lg:mt-0"
          >
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}
