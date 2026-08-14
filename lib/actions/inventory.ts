"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageOrgInventory } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { inventoryItems, type InventoryItem } from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

async function requireInventoryAccess() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageOrgInventory(session.user, tags)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");
  return session;
}

function parseQuantity(raw: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Quantity must be a non-negative integer");
  }
  return n;
}

export async function createOrgInventoryItem(formData: FormData) {
  const session = await requireInventoryAccess();

  const sku = (formData.get("sku") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(inventoryItems).values({
      id,
      orgId: session.user.orgId,
      sku,
      name,
      description,
      totalQuantity,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Created org inventory "${name}"`,
      entityType: "inventory_item",
      entityId: id,
      metadata: { sku, name, totalQuantity },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}

export async function updateOrgInventoryItem(formData: FormData) {
  const session = await requireInventoryAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing item id");

  const sku = (formData.get("sku") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(inventoryItems)
      .set({ sku, name, description, totalQuantity })
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Updated org inventory "${name}"`,
      entityType: "inventory_item",
      entityId: id,
      metadata: { sku, name, totalQuantity },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}

export async function deleteOrgInventoryItem(formData: FormData) {
  const session = await requireInventoryAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing item id");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Deleted org inventory item",
      entityType: "inventory_item",
      entityId: id,
    }),
  ]);

  revalidatePath("/dashboard/inventory");
}

export async function listOrgInventoryItems(
  orgId: string
): Promise<InventoryItem[]> {
  if (!db) return [];
  return withOrgQuery<InventoryItem[]>(orgId, (database) =>
    database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.orgId, orgId))
      .orderBy(asc(inventoryItems.name))
  );
}
