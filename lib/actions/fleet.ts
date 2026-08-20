"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageFleet, canViewFleet } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { fleetVehicles, type FleetVehicle } from "@/lib/db/schema";
import { inventoryHref } from "@/lib/inventory/hub";
import { requireSession } from "@/lib/org/context";

async function requireFleetView() {
  const session = await requireSession();
  if (!canViewFleet(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function requireFleetManage() {
  const session = await requireSession();
  if (!canManageFleet(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

function returnToFleet() {
  redirect(inventoryHref({ tab: "fleet" }));
}

export async function createFleetVehicle(formData: FormData) {
  const session = await requireFleetManage();

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Name is required");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(fleetVehicles).values({
      id,
      orgId: session.user.orgId,
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
      metadata: { name, plate, isActive },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToFleet();
}

export async function updateFleetVehicle(formData: FormData) {
  const session = await requireFleetManage();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing vehicle id");

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Name is required");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(fleetVehicles)
      .set({ name, plate, description, isActive })
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
      metadata: { name, plate, isActive },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToFleet();
}

export async function deleteFleetVehicle(formData: FormData) {
  const session = await requireFleetManage();

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
  returnToFleet();
}

export async function listFleetVehicles(orgId: string): Promise<FleetVehicle[]> {
  const session = await requireFleetView();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<FleetVehicle[]>(orgId, (database) =>
    database
      .select()
      .from(fleetVehicles)
      .where(eq(fleetVehicles.orgId, orgId))
      .orderBy(asc(fleetVehicles.name))
  );
}
