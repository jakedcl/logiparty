import { and, eq, ne, sum } from "drizzle-orm";
import { withOrgQuery } from "@/lib/db";
import {
  clientInventoryItems,
  inventoryItems,
  jobInventoryLines,
  jobs,
  type JobInventoryItemType,
} from "@/lib/db/schema";
import { lockActiveConditions } from "@/lib/jobs/lock-window";

/**
 * Units locked on other upcoming/ready jobs until load_out_end passes or job completes.
 */
export async function getLockedQuantity(args: {
  orgId: string;
  itemType: JobInventoryItemType;
  itemId: string;
  excludeJobId?: string;
}): Promise<number> {
  const { orgId, itemType, itemId, excludeJobId } = args;

  const itemMatch =
    itemType === "client"
      ? eq(jobInventoryLines.clientItemId, itemId)
      : eq(jobInventoryLines.orgItemId, itemId);

  const filters = [
    eq(jobInventoryLines.orgId, orgId),
    eq(jobInventoryLines.itemType, itemType),
    itemMatch,
    ...lockActiveConditions(),
  ];
  if (excludeJobId) {
    filters.push(ne(jobs.id, excludeJobId));
  }

  const rows = await withOrgQuery<{ locked: string | number | null }[]>(
    orgId,
    (database) =>
      database
        .select({
          locked: sum(jobInventoryLines.quantityAssigned),
        })
        .from(jobInventoryLines)
        .innerJoin(jobs, eq(jobInventoryLines.jobId, jobs.id))
        .where(and(...filters))
  );

  return Number(rows[0]?.locked ?? 0);
}

export async function getItemTotalQuantity(args: {
  orgId: string;
  itemType: JobInventoryItemType;
  itemId: string;
}): Promise<number> {
  const { orgId, itemType, itemId } = args;
  if (itemType === "client") {
    const rows = await withOrgQuery<{ totalQuantity: number }[]>(orgId, (database) =>
      database
        .select({ totalQuantity: clientInventoryItems.totalQuantity })
        .from(clientInventoryItems)
        .where(
          and(
            eq(clientInventoryItems.id, itemId),
            eq(clientInventoryItems.orgId, orgId)
          )
        )
        .limit(1)
    );
    if (!rows[0]) throw new Error("Client inventory item not found");
    return rows[0].totalQuantity;
  }

  const rows = await withOrgQuery<{ totalQuantity: number }[]>(orgId, (database) =>
    database
      .select({ totalQuantity: inventoryItems.totalQuantity })
      .from(inventoryItems)
      .where(
        and(eq(inventoryItems.id, itemId), eq(inventoryItems.orgId, orgId))
      )
      .limit(1)
  );
  if (!rows[0]) throw new Error("Org inventory item not found");
  return rows[0].totalQuantity;
}

/** Available units = catalog total − locked on other jobs. */
export async function getAvailableQuantity(args: {
  orgId: string;
  itemType: JobInventoryItemType;
  itemId: string;
  excludeJobId?: string;
}): Promise<{ total: number; locked: number; available: number }> {
  const [total, locked] = await Promise.all([
    getItemTotalQuantity(args),
    getLockedQuantity(args),
  ]);
  return { total, locked, available: Math.max(0, total - locked) };
}

export async function getAssignedOnJob(args: {
  orgId: string;
  jobId: string;
  itemType: JobInventoryItemType;
  itemId: string;
  excludeLineId?: string;
}): Promise<number> {
  const { orgId, jobId, itemType, itemId, excludeLineId } = args;
  const itemMatch =
    itemType === "client"
      ? eq(jobInventoryLines.clientItemId, itemId)
      : eq(jobInventoryLines.orgItemId, itemId);

  const filters = [
    eq(jobInventoryLines.orgId, orgId),
    eq(jobInventoryLines.jobId, jobId),
    eq(jobInventoryLines.itemType, itemType),
    itemMatch,
  ];
  if (excludeLineId) {
    filters.push(ne(jobInventoryLines.id, excludeLineId));
  }

  const rows = await withOrgQuery<{ assigned: string | number | null }[]>(
    orgId,
    (database) =>
      database
        .select({ assigned: sum(jobInventoryLines.quantityAssigned) })
        .from(jobInventoryLines)
        .where(and(...filters))
  );
  return Number(rows[0]?.assigned ?? 0);
}

export async function assertAssignmentFits(args: {
  orgId: string;
  jobId: string;
  itemType: JobInventoryItemType;
  itemId: string;
  quantityAssigned: number;
  excludeLineId?: string;
}) {
  const lockedOther = await getLockedQuantity({
    orgId: args.orgId,
    itemType: args.itemType,
    itemId: args.itemId,
    excludeJobId: args.jobId,
  });
  const otherOnJob = await getAssignedOnJob({
    orgId: args.orgId,
    jobId: args.jobId,
    itemType: args.itemType,
    itemId: args.itemId,
    excludeLineId: args.excludeLineId,
  });
  const total = await getItemTotalQuantity(args);
  const needed = otherOnJob + args.quantityAssigned;
  const available = Math.max(0, total - lockedOther);
  if (needed > available) {
    throw new Error(
      `Only ${available} available for this job (${total} total, ${lockedOther} locked elsewhere, ${otherOnJob} already on this job)`
    );
  }
}
