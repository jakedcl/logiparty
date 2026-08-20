"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageClientInventory } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  clientInventoryItems,
  warehouses,
  type ClientCompany,
  type ClientInventoryItem,
} from "@/lib/db/schema";
import { inventoryHref, parseWarehouseId } from "@/lib/inventory/hub";
import { normalizeSku } from "@/lib/inventory/sku";
import {
  getSessionClientCompany,
  getSessionStaffTags,
  requireSession,
} from "@/lib/org/context";

async function requireClientInventoryAccess() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageClientInventory(session.user, tags)) {
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

async function assertCompanyInOrg(orgId: string, clientCompanyId: string) {
  const companies = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .select({ id: clientCompanies.id })
      .from(clientCompanies)
      .where(
        and(
          eq(clientCompanies.id, clientCompanyId),
          eq(clientCompanies.orgId, orgId)
        )
      )
      .limit(1)
  );
  if (!companies[0]) throw new Error("Client company not found");
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

function returnToClient(formData: FormData, clientCompanyId?: string) {
  const location = String(formData.get("returnLocation") ?? "").trim();
  const company =
    clientCompanyId ||
    String(formData.get("clientCompanyId") ?? "").trim() ||
    undefined;
  redirect(
    inventoryHref({
      tab: "client",
      location: location || undefined,
      companyId: company,
    })
  );
}

export async function createClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const clientCompanyId = formData.get("clientCompanyId") as string;
  const sku = normalizeSku(String(formData.get("sku") ?? ""));
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));
  const warehouseId = parseWarehouseId(formData.get("warehouseId"));

  if (!clientCompanyId) throw new Error("Client company is required");
  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  await assertCompanyInOrg(session.user.orgId, clientCompanyId);
  await assertWarehouseInOrg(session.user.orgId, warehouseId);

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(clientInventoryItems).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId,
      warehouseId,
      sku,
      name,
      description,
      totalQuantity,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Created client inventory "${name}"`,
      entityType: "client_inventory_item",
      entityId: id,
      metadata: { clientCompanyId, sku, name, totalQuantity, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  revalidatePath("/portal");
  returnToClient(formData, clientCompanyId);
}

export async function updateClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const id = formData.get("id") as string;
  const clientCompanyId = formData.get("clientCompanyId") as string;
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
      .update(clientInventoryItems)
      .set({ sku, name, description, totalQuantity, warehouseId })
      .where(
        and(
          eq(clientInventoryItems.id, id),
          eq(clientInventoryItems.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Updated client inventory "${name}"`,
      entityType: "client_inventory_item",
      entityId: id,
      metadata: { clientCompanyId, sku, name, totalQuantity, warehouseId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  revalidatePath("/portal");
  returnToClient(formData, clientCompanyId || undefined);
}

export async function deleteClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const id = formData.get("id") as string;
  const clientCompanyId = formData.get("clientCompanyId") as string;
  if (!id) throw new Error("Missing item id");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(clientInventoryItems)
      .where(
        and(
          eq(clientInventoryItems.id, id),
          eq(clientInventoryItems.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Deleted client inventory item",
      entityType: "client_inventory_item",
      entityId: id,
      metadata: { clientCompanyId },
    }),
  ]);

  revalidatePath("/dashboard/inventory");
  revalidatePath("/portal");
  returnToClient(formData, clientCompanyId || undefined);
}

export async function listClientCompaniesForOrg(
  orgId: string
): Promise<ClientCompany[]> {
  const session = await requireClientInventoryAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<ClientCompany[]>(orgId, (database) =>
    database
      .select()
      .from(clientCompanies)
      .where(eq(clientCompanies.orgId, orgId))
      .orderBy(asc(clientCompanies.name))
  );
}

export async function listClientInventoryItems(
  orgId: string,
  clientCompanyId?: string,
  opts?: { warehouseId?: string | "unassigned" }
): Promise<ClientInventoryItem[]> {
  const session = await requireSession();
  if (!db) return [];
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  let companyId = clientCompanyId;
  if (session.user.isClient) {
    const company = await getSessionClientCompany(session);
    if (!company) return [];
    companyId = company.id;
  } else {
    const tags = await getSessionStaffTags(session);
    if (!canManageClientInventory(session.user, tags)) {
      throw new Error("Forbidden");
    }
  }

  const filters = [eq(clientInventoryItems.orgId, orgId)];
  if (companyId) {
    filters.push(eq(clientInventoryItems.clientCompanyId, companyId));
  }
  if (opts?.warehouseId === "unassigned") {
    filters.push(isNull(clientInventoryItems.warehouseId));
  } else if (opts?.warehouseId) {
    filters.push(eq(clientInventoryItems.warehouseId, opts.warehouseId));
  }
  return withOrgQuery<ClientInventoryItem[]>(orgId, (database) =>
    database
      .select()
      .from(clientInventoryItems)
      .where(and(...filters))
      .orderBy(asc(clientInventoryItems.name))
  );
}
