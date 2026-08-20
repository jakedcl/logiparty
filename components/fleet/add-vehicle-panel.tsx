import { createFleetVehicle } from "@/lib/actions/fleet";

export function AddFleetVehiclePanel() {
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
          Add vehicle
        </span>
      </summary>
      <form
        action={createFleetVehicle}
        className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
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
    </details>
  );
}
