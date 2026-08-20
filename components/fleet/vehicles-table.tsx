import {
  deleteFleetVehicle,
  updateFleetVehicle,
} from "@/lib/actions/fleet";
import type { FleetVehicle } from "@/lib/db/schema";

export function FleetVehiclesTable({
  vehicles,
  canEdit = false,
}: {
  vehicles: FleetVehicle[];
  /** Managers / OrgAdmin — inline Save/Delete. Viewers see read-only rows. */
  canEdit?: boolean;
}) {
  if (vehicles.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        {canEdit
          ? "No fleet vehicles yet. Use + Add vehicle above when you need one."
          : "No fleet vehicles yet."}
      </p>
    );
  }

  return (
    <div className="lp-table-wrap">
      <table className="lp-table min-w-[640px]">
        <thead>
          <tr>
            <th className="py-2 px-3 font-medium w-[10rem]">Name</th>
            <th className="py-2 px-3 font-medium w-[7rem]">Plate</th>
            <th className="py-2 px-3 font-medium">Description</th>
            <th className="py-2 px-3 font-medium w-[4.5rem]">Active</th>
            {canEdit ? (
              <th className="py-2 px-3 font-medium w-[7.5rem] text-right">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            if (!canEdit) {
              return (
                <tr key={vehicle.id} className="align-middle">
                  <td className="py-2 px-3 text-neutral-900 font-medium">
                    {vehicle.name}
                  </td>
                  <td className="py-2 px-3 font-mono text-sm text-neutral-700">
                    {vehicle.plate?.trim() ? vehicle.plate : "—"}
                  </td>
                  <td className="py-2 px-3 text-neutral-600">
                    {vehicle.description?.trim() ? vehicle.description : "—"}
                  </td>
                  <td className="py-2 px-3 text-sm text-neutral-700">
                    {vehicle.isActive ? "Yes" : "No"}
                  </td>
                </tr>
              );
            }

            const formId = `fleet-${vehicle.id}`;
            return (
              <tr key={vehicle.id} className="align-middle">
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
