import {
  deleteFleetVehicle,
  updateFleetVehicle,
} from "@/lib/actions/fleet";
import type { FleetVehicle } from "@/lib/db/schema";

export function FleetVehiclesTable({
  vehicles,
}: {
  vehicles: FleetVehicle[];
}) {
  if (vehicles.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No fleet vehicles yet. Use + Add vehicle below when you need one.
      </p>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[640px] text-sm text-left">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
            <th className="py-2 px-3 font-medium w-[10rem]">Name</th>
            <th className="py-2 px-3 font-medium w-[7rem]">Plate</th>
            <th className="py-2 px-3 font-medium">Description</th>
            <th className="py-2 px-3 font-medium w-[4.5rem]">Active</th>
            <th className="py-2 px-3 font-medium w-[7.5rem] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const formId = `fleet-${vehicle.id}`;
            return (
              <tr
                key={vehicle.id}
                className="border-b border-neutral-100 last:border-0 align-middle hover:bg-neutral-50/80"
              >
                <td className="py-1.5 px-3">
                  <input
                    form={formId}
                    name="name"
                    required
                    defaultValue={vehicle.name}
                    className="w-full min-w-[6rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white font-medium"
                  />
                </td>
                <td className="py-1.5 px-3">
                  <input
                    form={formId}
                    name="plate"
                    defaultValue={vehicle.plate ?? ""}
                    placeholder="—"
                    className="w-full max-w-[7rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm font-mono bg-transparent focus:bg-white"
                  />
                </td>
                <td className="py-1.5 px-3">
                  <input
                    form={formId}
                    name="description"
                    defaultValue={vehicle.description ?? ""}
                    placeholder="—"
                    className="w-full min-w-[8rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white"
                  />
                </td>
                <td className="py-1.5 px-3 text-center">
                  <input
                    form={formId}
                    type="checkbox"
                    name="isActive"
                    defaultChecked={vehicle.isActive}
                    className="rounded"
                    aria-label="Active"
                  />
                </td>
                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                  <form
                    id={formId}
                    action={updateFleetVehicle}
                    className="inline"
                  >
                    <input type="hidden" name="id" value={vehicle.id} />
                    <button
                      type="submit"
                      className="text-sm text-neutral-700 hover:text-neutral-900 font-medium mr-3"
                    >
                      Save
                    </button>
                  </form>
                  <form action={deleteFleetVehicle} className="inline">
                    <input type="hidden" name="id" value={vehicle.id} />
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
