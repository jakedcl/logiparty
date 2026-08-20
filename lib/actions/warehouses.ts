"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import {
  canManageClientInventory,
  canManageFleet,
  canManageOrgInventory,
} from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { warehouses, type Warehouse } from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

async function requireWarehouseAccess() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  const ok =
    canManageOrgInventory(session.user, tags) ||
    canManageClientInventory(session.user, tags) ||
    canManageFleet(session.user);
  if (!ok) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

export async function listWarehouses(orgId: string): Promise<Warehouse[]> {
  if (!db) return [];
  return withOrgQuery<Warehouse[]>(orgId, (database) =>
    database
      .select()
      .from(warehouses)
      .where(eq(warehouses.orgId, orgId))
      .orderBy(asc(warehouses.name))
  );
}

export async function createWarehouse(formData: FormData) {
  const session = await requireWarehouseAccess();

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  if (!name) throw new Error("Name is required");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(warehouses).values({
      id,
      orgId: session.user.orgId,
      name,
      address,
      isActive: true,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Created warehouse "${name}"`,
      entityType: "warehouse",
      entityId: id,
      metadata: { name, address },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}

export async function updateWarehouse(formData: FormData) {
  const session = await requireWarehouseAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing warehouse id");

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  if (!name) throw new Error("Name is required");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(warehouses)
      .set({ name, address, isActive })
      .where(
        and(eq(warehouses.id, id), eq(warehouses.orgId, session.user.orgId))
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Updated warehouse "${name}"`,
      entityType: "warehouse",
      entityId: id,
      metadata: { name, address, isActive },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}

export async function deleteWarehouse(formData: FormData) {
  const session = await requireWarehouseAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing warehouse id");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(warehouses)
      .where(
        and(eq(warehouses.id, id), eq(warehouses.orgId, session.user.orgId))
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Deleted warehouse",
      entityType: "warehouse",
      entityId: id,
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}
