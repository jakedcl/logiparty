"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageFleet } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  fleetVehicles,
  warehouses,
  type FleetVehicle,
} from "@/lib/db/schema";
import { inventoryHref, parseWarehouseId } from "@/lib/inventory/hub";
import { requireSession } from "@/lib/org/context";

async function requireFleetAccess() {
  const session = await requireSession();
  if (!canManageFleet(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function assertWarehouseInOrg(
  orgId: string,
  warehouseId: string | null
): Promise<void> {
  if (!warehouseId) return;
  const rows = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(and(eq(warehouses.id, warehouseId), eq(warehouses.orgId, orgId)))
      .limit(1)
  );
  if (!rows[0]) throw new Error("Warehouse not found");
}

function returnToFleet(formData: FormData) {
  const location = String(formData.get("returnLocation") ?? "").trim();
  redirect(
    inventoryHref({
      tab: "fleet",
      location: location || undefined,
    })
  );
}

export async function createFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  const warehouseId = parseWarehouseId(formData.get("warehouseId"));

  if (!name) throw new Error("Name is required");
  await assertWarehouseInOrg(session.user.orgId, warehouseId);

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(fleetVehicles).values({
      id,
      orgId: session.user.orgId,
      warehouseId,
      name,
      plate,
      description,
      isActive,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Created fleet vehicle "${name}"`,
      entityType: "fleet_vehicle",
      entityId: id,
      metadata: { name, plate, isActive, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToFleet(formData);
}

export async function updateFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing vehicle id");

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  const warehouseId = parseWarehouseId(formData.get("warehouseId"));

  if (!name) throw new Error("Name is required");
  await assertWarehouseInOrg(session.user.orgId, warehouseId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(fleetVehicles)
      .set({ name, plate, description, isActive, warehouseId })
      .where(
        and(
          eq(fleetVehicles.id, id),
          eq(fleetVehicles.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Updated fleet vehicle "${name}"`,
      entityType: "fleet_vehicle",
      entityId: id,
      metadata: { name, plate, isActive, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToFleet(formData);
}

export async function deleteFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing vehicle id");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.id, id),
          eq(fleetVehicles.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Deleted fleet vehicle",
      entityType: "fleet_vehicle",
      entityId: id,
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToFleet(formData);
}

export async function listFleetVehicles(
  orgId: string,
  opts?: { warehouseId?: string | "unassigned" }
): Promise<FleetVehicle[]> {
  const session = await requireFleetAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  const filters = [eq(fleetVehicles.orgId, orgId)];
  if (opts?.warehouseId === "unassigned") {
    filters.push(isNull(fleetVehicles.warehouseId));
  } else if (opts?.warehouseId) {
    filters.push(eq(fleetVehicles.warehouseId, opts.warehouseId));
  }
  return withOrgQuery<FleetVehicle[]>(orgId, (database) =>
    database
      .select()
      .from(fleetVehicles)
      .where(and(...filters))
      .orderBy(asc(fleetVehicles.name))
  );
}
