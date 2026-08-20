"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageOrgInventory } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  inventoryItems,
  warehouses,
  type InventoryItem,
} from "@/lib/db/schema";
import { inventoryHref, parseWarehouseId } from "@/lib/inventory/hub";
import { normalizeSku } from "@/lib/inventory/sku";
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

function returnToEquipment(formData: FormData) {
  const location = String(formData.get("returnLocation") ?? "").trim();
  redirect(
    inventoryHref({
      tab: "equipment",
      location: location || undefined,
    })
  );
}

export async function createOrgInventoryItem(formData: FormData) {
  const session = await requireInventoryAccess();

  const sku = normalizeSku(String(formData.get("sku") ?? ""));
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));
  const warehouseId = parseWarehouseId(formData.get("warehouseId"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");
  await assertWarehouseInOrg(session.user.orgId, warehouseId);

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(inventoryItems).values({
      id,
      orgId: session.user.orgId,
      warehouseId,
      sku,
      name,
      description,
      totalQuantity,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Created our inventory item "${name}"`,
      entityType: "inventory_item",
      entityId: id,
      metadata: { sku, name, totalQuantity, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToEquipment(formData);
}

export async function updateOrgInventoryItem(formData: FormData) {
  const session = await requireInventoryAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing item id");

  const sku = normalizeSku(String(formData.get("sku") ?? ""));
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));
  const warehouseId = parseWarehouseId(formData.get("warehouseId"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");
  await assertWarehouseInOrg(session.user.orgId, warehouseId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(inventoryItems)
      .set({ sku, name, description, totalQuantity, warehouseId })
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Updated our inventory item "${name}"`,
      entityType: "inventory_item",
      entityId: id,
      metadata: { sku, name, totalQuantity, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToEquipment(formData);
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
      action: "Deleted our inventory item",
      entityType: "inventory_item",
      entityId: id,
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  returnToEquipment(formData);
}

export async function listOrgInventoryItems(
  orgId: string,
  opts?: { warehouseId?: string | "unassigned" }
): Promise<InventoryItem[]> {
  if (!db) return [];
  const filters = [eq(inventoryItems.orgId, orgId)];
  if (opts?.warehouseId === "unassigned") {
    filters.push(isNull(inventoryItems.warehouseId));
  } else if (opts?.warehouseId) {
    filters.push(eq(inventoryItems.warehouseId, opts.warehouseId));
  }
  return withOrgQuery<InventoryItem[]>(orgId, (database) =>
    database
      .select()
      .from(inventoryItems)
      .where(and(...filters))
      .orderBy(asc(inventoryItems.name))
  );
}
