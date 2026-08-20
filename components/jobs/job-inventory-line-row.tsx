"use client";

import { QuietRemove } from "@/components/jobs/quiet-remove";
import { ViewEdit } from "@/components/ui/view-edit";
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
    <tr className="align-middle">
      <td className="py-2 px-3 font-mono text-xs text-neutral-600 whitespace-nowrap">
        {line.itemSku ?? "—"}
      </td>
      <td className="py-2 px-3 text-sm text-neutral-900 min-w-0">
        <span className="block truncate">{line.itemName}</span>
        <span className="text-xs text-neutral-400 capitalize">{line.itemType}</span>
      </td>
      <td className="py-2 px-3">
        <ViewEdit
          variant="inline"
          editLabel="Edit"
          view={
            <span className="tabular-nums text-sm text-neutral-800 whitespace-nowrap">
              {line.quantityAssigned}
              <span className="text-neutral-300 mx-1">·</span>
              <span className="text-neutral-500">{line.quantityLoaded} loaded</span>
            </span>
          }
          edit={({ onCancel }) => (
            <div className="flex flex-wrap gap-2 items-end py-1">
              <form
                action={updateJobInventoryLine}
                className="flex flex-wrap gap-2 items-end"
              >
                <input type="hidden" name="id" value={line.id} />
                <input type="hidden" name="jobId" value={jobId} />
                <label className="text-xs text-neutral-600">
                  Assigned
                  <input
                    name="quantityAssigned"
                    type="number"
                    min={1}
                    required
                    defaultValue={line.quantityAssigned}
                    className="mt-1 w-20 border border-neutral-200 rounded px-2 py-1.5 text-sm tabular-nums"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded px-2.5 py-1.5 text-xs border border-neutral-300 h-[34px]"
                >
                  Save
                </button>
              </form>
              <form
                action={updateQuantityLoaded}
                className="flex flex-wrap gap-2 items-end"
              >
                <input type="hidden" name="id" value={line.id} />
                <input type="hidden" name="jobId" value={jobId} />
                <label className="text-xs text-neutral-600">
                  Loaded
                  <input
                    name="quantityLoaded"
                    type="number"
                    min={0}
                    max={line.quantityAssigned}
                    required
                    defaultValue={line.quantityLoaded}
                    className="mt-1 w-20 border border-neutral-200 rounded px-2 py-1.5 text-sm tabular-nums"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded px-2.5 py-1.5 text-xs border border-neutral-300 h-[34px]"
                >
                  Save
                </button>
              </form>
              <button
                type="button"
                onClick={onCancel}
                className="rounded px-2.5 py-1.5 text-xs text-neutral-600 border border-neutral-300 h-[34px]"
              >
                Cancel
              </button>
            </div>
          )}
        />
      </td>
      <td className="py-2 px-2 text-right w-10">
        <QuietRemove>
          <form action={deleteJobInventoryLine}>
            <input type="hidden" name="id" value={line.id} />
            <input type="hidden" name="jobId" value={jobId} />
            <button type="submit">Remove</button>
          </form>
        </QuietRemove>
      </td>
    </tr>
  );
}
