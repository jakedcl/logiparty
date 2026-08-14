"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canManageFleet } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { fleetVehicles } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireFleetAccess() {
  const session = await requireSession();
  if (!canManageFleet(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

export async function createFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Name is required");

  await db!.insert(fleetVehicles).values({
    orgId: session.user.orgId,
    name,
    plate,
    description,
    isActive,
  });

  revalidatePath("/dashboard/fleet");
}

export async function updateFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing vehicle id");

  const name = (formData.get("name") as string)?.trim();
  const plate = (formData.get("plate") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Name is required");

  await db!
    .update(fleetVehicles)
    .set({ name, plate, description, isActive })
    .where(
      and(
        eq(fleetVehicles.id, id),
        eq(fleetVehicles.orgId, session.user.orgId)
      )
    );

  revalidatePath("/dashboard/fleet");
}

export async function deleteFleetVehicle(formData: FormData) {
  const session = await requireFleetAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing vehicle id");

  await db!
    .delete(fleetVehicles)
    .where(
      and(
        eq(fleetVehicles.id, id),
        eq(fleetVehicles.orgId, session.user.orgId)
      )
    );

  revalidatePath("/dashboard/fleet");
}

export async function listFleetVehicles(orgId: string) {
  const session = await requireFleetAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return db!
    .select()
    .from(fleetVehicles)
    .where(eq(fleetVehicles.orgId, orgId))
    .orderBy(asc(fleetVehicles.name));
}
