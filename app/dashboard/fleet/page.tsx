import { redirect } from "next/navigation";
import { AddFleetVehiclePanel } from "@/components/fleet/add-vehicle-panel";
import { FleetVehiclesTable } from "@/components/fleet/vehicles-table";
import { canManageFleet } from "@/lib/auth/permissions";
import { listFleetVehicles } from "@/lib/actions/fleet";
import { requireSession } from "@/lib/org/context";

export default async function FleetPage() {
  const session = await requireSession();
  if (!canManageFleet(session.user)) redirect("/dashboard");

  const vehicles = await listFleetVehicles(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Fleet</h1>
        <p className="text-sm text-neutral-500">
          Box trucks, vans, and other vehicles assigned to jobs. Separate from
          our inventory and client inventory.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Vehicles
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({vehicles.length})
            </span>
          </h2>
        </div>

        <FleetVehiclesTable vehicles={vehicles} />
        <AddFleetVehiclePanel />
      </section>
    </div>
  );
}
