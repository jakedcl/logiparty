"use client";

import {
  DetailFields,
  ViewEdit,
} from "@/components/ui/view-edit";
import {
  deleteJobInventoryLine,
  updateJobInventoryLine,
  updateQuantityLoaded,
} from "@/lib/actions/job-inventory";

export function JobInventoryLineRow({
  jobId,
  line,
}: {
  jobId: string;
  line: {
    id: string;
    itemSku: string | null;
    itemName: string;
    itemType: string;
    quantityAssigned: number;
    quantityLoaded: number;
  };
}) {
  return (
    <li className="border border-neutral-200 rounded-md px-3 py-3 space-y-2">
      <p className="text-sm font-medium">
        {line.itemSku ? `${line.itemSku} — ` : ""}
        {line.itemName}{" "}
        <span className="text-neutral-500 font-normal">({line.itemType})</span>
      </p>
      <ViewEdit
        editLabel="Edit quantities"
        view={
          <DetailFields
            rows={[
              {
                label: "Assigned",
                value: (
                  <span className="tabular-nums">{line.quantityAssigned}</span>
                ),
              },
              {
                label: "Loaded",
                value: (
                  <span className="tabular-nums">{line.quantityLoaded}</span>
                ),
              },
            ]}
          />
        }
        edit={({ onCancel }) => (
          <div className="space-y-3">
            <form
              action={updateJobInventoryLine}
              className="flex flex-wrap gap-2 items-end"
            >
              <input type="hidden" name="id" value={line.id} />
              <input type="hidden" name="jobId" value={jobId} />
              <label className="text-sm text-neutral-600">
                Assigned qty
                <input
                  name="quantityAssigned"
                  type="number"
                  min={1}
                  required
                  defaultValue={line.quantityAssigned}
                  className="mt-1 w-28 border rounded px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm border border-neutral-300 h-[42px]"
              >
                Save assigned
              </button>
            </form>
            <form
              action={updateQuantityLoaded}
              className="flex flex-wrap gap-2 items-end"
            >
              <input type="hidden" name="id" value={line.id} />
              <input type="hidden" name="jobId" value={jobId} />
              <label className="text-sm text-neutral-600">
                Loaded qty
                <input
                  name="quantityLoaded"
                  type="number"
                  min={0}
                  max={line.quantityAssigned}
                  required
                  defaultValue={line.quantityLoaded}
                  className="mt-1 w-28 border rounded px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm border border-neutral-300 h-[42px]"
              >
                Save loaded
              </button>
            </form>
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-3 py-2 text-sm text-neutral-600 border border-neutral-300 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        )}
      />
      <form action={deleteJobInventoryLine}>
        <input type="hidden" name="id" value={line.id} />
        <input type="hidden" name="jobId" value={jobId} />
        <button
          type="submit"
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </form>
    </li>
  );
}
