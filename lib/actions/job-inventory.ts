"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import {
  canManageJobs,
  canUpdateQuantityLoaded,
} from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { assertAssignmentFits } from "@/lib/jobs/inventory-locks";
import {
  clientInventoryItems,
  inventoryItems,
  JOB_INVENTORY_ITEM_TYPES,
  jobInventoryLines,
  jobs,
  type ClientInventoryItem,
  type InventoryItem,
  type JobInventoryItemType,
  type JobInventoryLine,
} from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

async function requireJobsAccess() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function getJobOrThrow(orgId: string, jobId: string) {
  const rows = await withOrgQuery<(typeof jobs.$inferSelect)[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  if (!rows[0]) throw new Error("Job not found");
  return rows[0];
}

function parseItemType(raw: FormDataEntryValue | null): JobInventoryItemType {
  const value = String(raw ?? "");
  if (!(JOB_INVENTORY_ITEM_TYPES as readonly string[]).includes(value)) {
    throw new Error("Invalid item type");
  }
  return value as JobInventoryItemType;
}

function parseQty(raw: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("Quantity must be at least 1");
  }
  return n;
}

export type JobInventoryLineView = JobInventoryLine & {
  itemName: string;
  itemSku: string | null;
};

export async function listJobInventoryLines(
  orgId: string,
  jobId: string
): Promise<JobInventoryLineView[]> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  await getJobOrThrow(orgId, jobId);

  const lines = await withOrgQuery<JobInventoryLine[]>(orgId, (database) =>
    database
      .select()
      .from(jobInventoryLines)
      .where(
        and(eq(jobInventoryLines.jobId, jobId), eq(jobInventoryLines.orgId, orgId))
      )
      .orderBy(asc(jobInventoryLines.itemType))
  );

  const [clientItems, orgItems] = await Promise.all([
    withOrgQuery<ClientInventoryItem[]>(orgId, (database) =>
      database
        .select()
        .from(clientInventoryItems)
        .where(eq(clientInventoryItems.orgId, orgId))
    ),
    withOrgQuery<InventoryItem[]>(orgId, (database) =>
      database
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.orgId, orgId))
    ),
  ]);

  const clientById = new Map(clientItems.map((i) => [i.id, i]));
  const orgById = new Map(orgItems.map((i) => [i.id, i]));

  return lines.map((line) => {
    if (line.itemType === "client" && line.clientItemId) {
      const item = clientById.get(line.clientItemId);
      return {
        ...line,
        itemName: item?.name ?? "Unknown client item",
        itemSku: item?.sku ?? null,
      };
    }
    const item = line.orgItemId ? orgById.get(line.orgItemId) : undefined;
    return {
      ...line,
      itemName: item?.name ?? "Unknown org item",
      itemSku: item?.sku ?? null,
    };
  });
}

export async function listAssignableClientInventory(
  orgId: string,
  clientCompanyId: string
): Promise<ClientInventoryItem[]> {
  await requireJobsAccess();
  return withOrgQuery<ClientInventoryItem[]>(orgId, (database) =>
    database
      .select()
      .from(clientInventoryItems)
      .where(
        and(
          eq(clientInventoryItems.orgId, orgId),
          eq(clientInventoryItems.clientCompanyId, clientCompanyId)
        )
      )
      .orderBy(asc(clientInventoryItems.name))
  );
}

export async function listAssignableOrgInventory(
  orgId: string
): Promise<InventoryItem[]> {
  await requireJobsAccess();
  return withOrgQuery<InventoryItem[]>(orgId, (database) =>
    database
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.orgId, orgId))
      .orderBy(asc(inventoryItems.name))
  );
}

export async function addJobInventoryLine(formData: FormData) {
  const session = await requireJobsAccess();
  const jobId = formData.get("jobId") as string;
  if (!jobId) throw new Error("Missing job id");

  const job = await getJobOrThrow(session.user.orgId, jobId);
  const itemType = parseItemType(formData.get("itemType"));
  const itemId = formData.get("itemId") as string;
  const quantityAssigned = parseQty(formData.get("quantityAssigned"));
  if (!itemId) throw new Error("Item is required");

  const id = randomUUID();
  const values =
    itemType === "client"
      ? {
          id,
          jobId,
          orgId: session.user.orgId,
          itemType,
          clientItemId: itemId,
          orgItemId: null as string | null,
          quantityAssigned,
          quantityLoaded: 0,
        }
      : {
          id,
          jobId,
          orgId: session.user.orgId,
          itemType,
          clientItemId: null as string | null,
          orgItemId: itemId,
          quantityAssigned,
          quantityLoaded: 0,
        };

  if (itemType === "client") {
    const allClient = await withOrgQuery<ClientInventoryItem[]>(
      session.user.orgId,
      (database) =>
        database
          .select()
          .from(clientInventoryItems)
          .where(eq(clientInventoryItems.orgId, session.user.orgId))
    );
    if (!allClient.some((i) => i.id === itemId)) {
      throw new Error("Client inventory item not found");
    }
  } else {
    const items = await listAssignableOrgInventory(session.user.orgId);
    if (!items.some((i) => i.id === itemId)) {
      throw new Error("Org inventory item not found");
    }
  }

  await assertAssignmentFits({
    orgId: session.user.orgId,
    jobId,
    itemType,
    itemId,
    quantityAssigned,
  });

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(jobInventoryLines).values(values),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Assigned inventory line (${itemType})`,
      entityType: "job_inventory_line",
      entityId: id,
      metadata: { itemType, itemId, quantityAssigned },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function updateJobInventoryLine(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  if (!id || !jobId) throw new Error("Missing line id");
  const quantityAssigned = parseQty(formData.get("quantityAssigned"));

  await getJobOrThrow(session.user.orgId, jobId);

  const existing = await withOrgQuery<JobInventoryLine[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(jobInventoryLines)
        .where(
          and(
            eq(jobInventoryLines.id, id),
            eq(jobInventoryLines.jobId, jobId),
            eq(jobInventoryLines.orgId, session.user.orgId)
          )
        )
        .limit(1)
  );
  const line = existing[0];
  if (!line) throw new Error("Inventory line not found");

  const itemId =
    line.itemType === "client" ? line.clientItemId : line.orgItemId;
  if (!itemId) throw new Error("Inventory line is missing item reference");

  await assertAssignmentFits({
    orgId: session.user.orgId,
    jobId,
    itemType: line.itemType,
    itemId,
    quantityAssigned,
    excludeLineId: id,
  });

  if (quantityAssigned < line.quantityLoaded) {
    throw new Error("Assigned qty cannot be less than already loaded qty");
  }

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(jobInventoryLines)
      .set({ quantityAssigned })
      .where(
        and(
          eq(jobInventoryLines.id, id),
          eq(jobInventoryLines.jobId, jobId),
          eq(jobInventoryLines.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Updated inventory assignment qty",
      entityType: "job_inventory_line",
      entityId: id,
      metadata: { quantityAssigned },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function updateQuantityLoaded(formData: FormData) {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canUpdateQuantityLoaded(session.user, tags)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");

  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  if (!id || !jobId) throw new Error("Missing line id");

  const quantityLoaded = Number.parseInt(
    String(formData.get("quantityLoaded") ?? ""),
    10
  );
  if (!Number.isFinite(quantityLoaded) || quantityLoaded < 0) {
    throw new Error("Loaded qty must be a non-negative integer");
  }

  const existing = await withOrgQuery<JobInventoryLine[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(jobInventoryLines)
        .where(
          and(
            eq(jobInventoryLines.id, id),
            eq(jobInventoryLines.jobId, jobId),
            eq(jobInventoryLines.orgId, session.user.orgId)
          )
        )
        .limit(1)
  );
  const line = existing[0];
  if (!line) throw new Error("Inventory line not found");

  if (quantityLoaded > line.quantityAssigned) {
    throw new Error("Loaded qty cannot exceed assigned qty");
  }

  const itemId =
    line.itemType === "client" ? line.clientItemId : line.orgItemId;
  if (!itemId) throw new Error("Inventory line is missing item reference");

  // Loading does not increase lock beyond assigned; still ensure catalog has stock
  await assertAssignmentFits({
    orgId: session.user.orgId,
    jobId,
    itemType: line.itemType,
    itemId,
    quantityAssigned: line.quantityAssigned,
    excludeLineId: id,
  });

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(jobInventoryLines)
      .set({ quantityLoaded })
      .where(
        and(
          eq(jobInventoryLines.id, id),
          eq(jobInventoryLines.jobId, jobId),
          eq(jobInventoryLines.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Updated quantity loaded",
      entityType: "job_inventory_line",
      entityId: id,
      metadata: { quantityLoaded, quantityAssigned: line.quantityAssigned },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function deleteJobInventoryLine(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  if (!id || !jobId) throw new Error("Missing line id");

  await getJobOrThrow(session.user.orgId, jobId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobInventoryLines)
      .where(
        and(
          eq(jobInventoryLines.id, id),
          eq(jobInventoryLines.jobId, jobId),
          eq(jobInventoryLines.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Removed inventory line from job",
      entityType: "job_inventory_line",
      entityId: id,
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}
