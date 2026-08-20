"use server";

import { randomUUID } from "crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageClientInventory } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  clientInventoryItems,
  clientInventoryRequests,
  users,
  type ClientInventoryItem,
  type ClientInventoryRequest,
  type InventoryRequestType,
} from "@/lib/db/schema";
import { normalizeSku } from "@/lib/inventory/sku";
import {
  getSessionClientCompany,
  getSessionStaffTags,
  requireSession,
} from "@/lib/org/context";

export type InventoryRequestView = ClientInventoryRequest & {
  clientName: string | null;
  requesterLabel: string;
  itemSku: string | null;
  itemName: string | null;
  itemQty: number | null;
};

function parseQuantity(
  raw: FormDataEntryValue | null,
  label = "Quantity"
): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return n;
}

function requireReason(raw: FormDataEntryValue | null): string {
  const reason = String(raw ?? "").trim();
  if (!reason) throw new Error("Reason is required");
  return reason;
}

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

function typeLabel(type: InventoryRequestType): string {
  switch (type) {
    case "add":
      return "Add item";
    case "qty_change":
      return "Qty change";
    case "remove":
      return "Remove";
  }
}

async function requireClientPortalCompany() {
  const session = await requireSession();
  if (!session.user.isClient) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  const company = await getSessionClientCompany(session);
  if (!company) throw new Error("No client company linked");
  return { session, company };
}

async function requireInventoryRequestReviewer() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageClientInventory(session.user, tags)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");
  return session;
}

async function enrichRequests(
  orgId: string,
  rows: ClientInventoryRequest[]
): Promise<InventoryRequestView[]> {
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.requestedByUserId))];
  const companyIds = [...new Set(rows.map((r) => r.clientCompanyId))];
  const itemIds = [
    ...new Set(
      rows
        .map((r) => r.clientInventoryItemId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [people, companies, items] = await Promise.all([
    db!
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, userIds)),
    withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
      database
        .select({ id: clientCompanies.id, name: clientCompanies.name })
        .from(clientCompanies)
        .where(
          and(
            eq(clientCompanies.orgId, orgId),
            inArray(clientCompanies.id, companyIds)
          )
        )
    ),
    itemIds.length === 0
      ? Promise.resolve([] as ClientInventoryItem[])
      : withOrgQuery<ClientInventoryItem[]>(orgId, (database) =>
          database
            .select()
            .from(clientInventoryItems)
            .where(
              and(
                eq(clientInventoryItems.orgId, orgId),
                inArray(clientInventoryItems.id, itemIds)
              )
            )
        ),
  ]);

  const byUser = new Map(people.map((u) => [u.id, u]));
  const byCompany = new Map(companies.map((c) => [c.id, c]));
  const byItem = new Map(items.map((i) => [i.id, i]));

  return rows.map((row) => {
    const u = byUser.get(row.requestedByUserId);
    const item = row.clientInventoryItemId
      ? byItem.get(row.clientInventoryItemId)
      : undefined;
    return {
      ...row,
      clientName: byCompany.get(row.clientCompanyId)?.name ?? null,
      requesterLabel: u ? displayName(u) : "Unknown user",
      itemSku: item?.sku ?? row.proposedSku,
      itemName: item?.name ?? row.proposedName,
      itemQty: item?.totalQuantity ?? null,
    };
  });
}

async function loadPendingRequest(orgId: string, id: string) {
  const rows = await withOrgQuery<ClientInventoryRequest[]>(orgId, (database) =>
    database
      .select()
      .from(clientInventoryRequests)
      .where(
        and(
          eq(clientInventoryRequests.id, id),
          eq(clientInventoryRequests.orgId, orgId)
        )
      )
      .limit(1)
  );
  const existing = rows[0];
  if (!existing) throw new Error("Request not found");
  if (existing.status !== "pending") {
    throw new Error("Request was already reviewed");
  }
  return existing;
}

function revalidateInventoryPaths(clientCompanyId: string) {
  revalidatePath("/portal/inventory");
  revalidatePath("/portal/inventory/requests/new");
  revalidatePath("/portal");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/client-inventory");
  revalidatePath(`/dashboard/client-inventory?companyId=${clientCompanyId}`);
}

export async function listPortalInventoryRequests(
  orgId: string
): Promise<InventoryRequestView[]> {
  const { session, company } = await requireClientPortalCompany();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const rows = await withOrgQuery<ClientInventoryRequest[]>(orgId, (database) =>
    database
      .select()
      .from(clientInventoryRequests)
      .where(
        and(
          eq(clientInventoryRequests.orgId, orgId),
          eq(clientInventoryRequests.clientCompanyId, company.id)
        )
      )
      .orderBy(desc(clientInventoryRequests.createdAt))
  );

  return enrichRequests(orgId, rows);
}

export async function listPendingInventoryRequests(
  orgId: string,
  clientCompanyId?: string
): Promise<InventoryRequestView[]> {
  const session = await requireInventoryRequestReviewer();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const filters = [
    eq(clientInventoryRequests.orgId, orgId),
    eq(clientInventoryRequests.status, "pending"),
  ];
  if (clientCompanyId) {
    filters.push(eq(clientInventoryRequests.clientCompanyId, clientCompanyId));
  }

  const rows = await withOrgQuery<ClientInventoryRequest[]>(orgId, (database) =>
    database
      .select()
      .from(clientInventoryRequests)
      .where(and(...filters))
      .orderBy(asc(clientInventoryRequests.createdAt))
  );

  return enrichRequests(orgId, rows);
}

export async function requestInventoryAdd(formData: FormData) {
  const { session, company } = await requireClientPortalCompany();

  const sku = normalizeSku(String(formData.get("sku") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const quantity = parseQuantity(formData.get("quantity"));
  const reason = requireReason(formData.get("reason"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(clientInventoryRequests).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId: company.id,
      requestedByUserId: session.user.id,
      type: "add",
      proposedSku: sku,
      proposedName: name,
      proposedDescription: description,
      proposedQuantity: quantity,
      reason,
      status: "pending",
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Requested new inventory item "${name}"`,
      entityType: "client_inventory_request",
      entityId: id,
      metadata: {
        type: "add",
        clientCompanyId: company.id,
        sku,
        name,
        quantity,
      },
      isClientVisible: true,
    }),
  ]);

  revalidateInventoryPaths(company.id);
  redirect("/portal/inventory");
}

export async function requestInventoryQtyChange(formData: FormData) {
  const { session, company } = await requireClientPortalCompany();

  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) throw new Error("Missing item id");
  const quantity = parseQuantity(formData.get("quantity"));
  const reason = requireReason(formData.get("reason"));

  const items = await withOrgQuery<ClientInventoryItem[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(clientInventoryItems)
        .where(
          and(
            eq(clientInventoryItems.id, itemId),
            eq(clientInventoryItems.orgId, session.user.orgId),
            eq(clientInventoryItems.clientCompanyId, company.id)
          )
        )
        .limit(1)
  );
  const item = items[0];
  if (!item) throw new Error("Item not found");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(clientInventoryRequests).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId: company.id,
      requestedByUserId: session.user.id,
      type: "qty_change",
      clientInventoryItemId: item.id,
      proposedSku: item.sku,
      proposedName: item.name,
      proposedQuantity: quantity,
      reason,
      status: "pending",
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Requested qty change for "${item.name}"`,
      entityType: "client_inventory_request",
      entityId: id,
      metadata: {
        type: "qty_change",
        clientCompanyId: company.id,
        itemId: item.id,
        fromQty: item.totalQuantity,
        toQty: quantity,
      },
      isClientVisible: true,
    }),
  ]);

  revalidateInventoryPaths(company.id);
  redirect("/portal/inventory");
}

export async function requestInventoryRemove(formData: FormData) {
  const { session, company } = await requireClientPortalCompany();

  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) throw new Error("Missing item id");
  const reason = requireReason(formData.get("reason"));

  const items = await withOrgQuery<ClientInventoryItem[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(clientInventoryItems)
        .where(
          and(
            eq(clientInventoryItems.id, itemId),
            eq(clientInventoryItems.orgId, session.user.orgId),
            eq(clientInventoryItems.clientCompanyId, company.id)
          )
        )
        .limit(1)
  );
  const item = items[0];
  if (!item) throw new Error("Item not found");

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(clientInventoryRequests).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId: company.id,
      requestedByUserId: session.user.id,
      type: "remove",
      clientInventoryItemId: item.id,
      proposedSku: item.sku,
      proposedName: item.name,
      proposedQuantity: item.totalQuantity,
      reason,
      status: "pending",
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Requested removal of "${item.name}"`,
      entityType: "client_inventory_request",
      entityId: id,
      metadata: {
        type: "remove",
        clientCompanyId: company.id,
        itemId: item.id,
        sku: item.sku,
      },
      isClientVisible: true,
    }),
  ]);

  revalidateInventoryPaths(company.id);
  redirect("/portal/inventory");
}

export async function approveInventoryRequest(formData: FormData) {
  const session = await requireInventoryRequestReviewer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing request id");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null;

  const existing = await loadPendingRequest(session.user.orgId, id);
  const now = new Date();
  const newItemId = randomUUID();

  await withOrgQueries(session.user.orgId, (database) => {
    let applyQuery;
    if (existing.type === "add") {
      const sku = normalizeSku(existing.proposedSku ?? "");
      const name = (existing.proposedName ?? "").trim();
      const qty = existing.proposedQuantity;
      if (!sku || !name || qty == null || qty < 0) {
        throw new Error("Add request is missing required fields");
      }
      applyQuery = database.insert(clientInventoryItems).values({
        id: newItemId,
        orgId: session.user.orgId,
        clientCompanyId: existing.clientCompanyId,
        sku,
        name,
        description: existing.proposedDescription,
        totalQuantity: qty,
      });
    } else if (existing.type === "qty_change") {
      if (!existing.clientInventoryItemId || existing.proposedQuantity == null) {
        throw new Error("Qty change request is missing item or quantity");
      }
      applyQuery = database
        .update(clientInventoryItems)
        .set({ totalQuantity: existing.proposedQuantity })
        .where(
          and(
            eq(clientInventoryItems.id, existing.clientInventoryItemId),
            eq(clientInventoryItems.orgId, session.user.orgId),
            eq(clientInventoryItems.clientCompanyId, existing.clientCompanyId)
          )
        );
    } else {
      if (!existing.clientInventoryItemId) {
        throw new Error("Remove request is missing item");
      }
      applyQuery = database
        .delete(clientInventoryItems)
        .where(
          and(
            eq(clientInventoryItems.id, existing.clientInventoryItemId),
            eq(clientInventoryItems.orgId, session.user.orgId),
            eq(clientInventoryItems.clientCompanyId, existing.clientCompanyId)
          )
        );
    }

    return [
      applyQuery,
      database
        .update(clientInventoryRequests)
        .set({
          status: "approved",
          reviewerUserId: session.user.id,
          reviewedAt: now,
          reviewNote,
          updatedAt: now,
        })
        .where(
          and(
            eq(clientInventoryRequests.id, id),
            eq(clientInventoryRequests.orgId, session.user.orgId)
          )
        ),
      activityLogInsert(database, {
        orgId: session.user.orgId,
        userId: session.user.id,
        action: `Approved inventory request (${typeLabel(existing.type)})`,
        entityType: "client_inventory_request",
        entityId: id,
        metadata: {
          type: existing.type,
          clientCompanyId: existing.clientCompanyId,
          reviewNote,
          appliedItemId:
            existing.type === "add" ? newItemId : existing.clientInventoryItemId,
        },
        isClientVisible: true,
      }),
    ];
  });

  revalidateInventoryPaths(existing.clientCompanyId);
}

export async function denyInventoryRequest(formData: FormData) {
  const session = await requireInventoryRequestReviewer();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing request id");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null;

  const existing = await loadPendingRequest(session.user.orgId, id);
  const now = new Date();

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(clientInventoryRequests)
      .set({
        status: "denied",
        reviewerUserId: session.user.id,
        reviewedAt: now,
        reviewNote,
        updatedAt: now,
      })
      .where(
        and(
          eq(clientInventoryRequests.id, id),
          eq(clientInventoryRequests.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `Denied inventory request (${typeLabel(existing.type)})`,
      entityType: "client_inventory_request",
      entityId: id,
      metadata: {
        type: existing.type,
        clientCompanyId: existing.clientCompanyId,
        reviewNote,
      },
      isClientVisible: true,
    }),
  ]);

  revalidateInventoryPaths(existing.clientCompanyId);
}

export { typeLabel as inventoryRequestTypeLabel };
