import { redirect } from "next/navigation";
import { canManageFleet } from "@/lib/auth/permissions";
import {
  createFleetVehicle,
  deleteFleetVehicle,
  listFleetVehicles,
  updateFleetVehicle,
} from "@/lib/actions/fleet";
import { requireSession } from "@/lib/org/context";

export default async function FleetPage() {
  const session = await requireSession();
  if (!canManageFleet(session.user)) redirect("/dashboard");

  const vehicles = await listFleetVehicles(session.user.orgId);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Fleet</h1>
        <p className="text-sm text-neutral-500">
          Box trucks, vans, and other vehicles assigned to jobs. Separate from
          our inventory and client inventory.
        </p>
      </div>

      <section className="border rounded-lg p-4 bg-white max-w-2xl">
        <h2 className="font-medium mb-3">Add vehicle</h2>
        <form action={createFleetVehicle} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Name (e.g. Box Truck 12)"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              name="plate"
              placeholder="Plate (optional)"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <input
            name="description"
            placeholder="Description (optional)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2 items-center justify-between">
            <label className="text-sm flex items-center gap-2">
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
              className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
            >
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Vehicles ({vehicles.length})</h2>
        {vehicles.length === 0 && (
          <p className="text-sm text-neutral-500">No fleet vehicles yet.</p>
        )}
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border rounded-lg p-4 bg-white max-w-2xl space-y-3"
          >
            <form action={updateFleetVehicle} className="space-y-2">
              <input type="hidden" name="id" value={vehicle.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  defaultValue={vehicle.name}
                  className="border rounded px-3 py-2 text-sm"
                />
                <input
                  name="plate"
                  defaultValue={vehicle.plate ?? ""}
                  placeholder="Plate (optional)"
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <input
                name="description"
                defaultValue={vehicle.description ?? ""}
                placeholder="Description (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-2 items-center justify-between">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={vehicle.isActive}
                    className="rounded"
                  />
                  Active
                </label>
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-sm font-medium border border-neutral-300"
                >
                  Save
                </button>
              </div>
            </form>
            <form action={deleteFleetVehicle}>
              <input type="hidden" name="id" value={vehicle.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
