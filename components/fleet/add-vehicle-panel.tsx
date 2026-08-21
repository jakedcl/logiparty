"use client";

import { useState } from "react";
import { createFleetVehicle } from "@/lib/actions/fleet";

/** Caption left, + Add vehicle right (managers only). Form opens below the row. */
export function AddFleetVehiclePanel({
  caption,
  canAdd = true,
}: {
  caption?: string;
  canAdd?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {caption ? (
          <p className="text-sm text-neutral-500 max-w-2xl pt-0.5">{caption}</p>
        ) : (
          <span />
        )}
        {canAdd ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 text-sm font-medium text-neutral-900 hover:underline underline-offset-2"
          >
            {open ? "Cancel" : "+ Add vehicle"}
          </button>
        ) : null}
      </div>
      {canAdd && open ? (
        <form
          action={createFleetVehicle}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-end border-t border-neutral-200 pt-3"
        >
          <label className="text-xs text-neutral-500 sm:col-span-1 lg:col-span-2">
            Name
            <input
              name="name"
              required
              placeholder="e.g. Box Truck 12"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-500 lg:col-span-1">
            Plate
            <input
              name="plate"
              placeholder="Optional"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm font-mono"
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
          <div className="flex items-center gap-3 lg:justify-end h-[34px] mt-5 lg:mt-0">
            <label className="text-sm flex items-center gap-1.5 text-neutral-600">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="rounded"
              />
              Active
            </label>
            <button
              type="submit"
              className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px]"
            >
              Add
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
