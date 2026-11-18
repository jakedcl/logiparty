import { and, eq } from "drizzle-orm";
import { withOrgQuery } from "@/lib/db";
import {
  jobFleetAssignments,
  jobInventoryLines,
  type JobInventoryItemType,
  type JobStatus,
} from "@/lib/db/schema";
import { isFleetVehicleLocked } from "@/lib/jobs/fleet-locks";
import {
  getItemTotalQuantity,
  getLockedQuantity,
} from "@/lib/jobs/inventory-locks";
import { LOCKING_JOB_STATUSES } from "@/lib/jobs/lock-window";

/** True for statuses whose inventory and vehicles are locked. */
export function isLockingStatus(status: JobStatus): boolean {
  return (LOCKING_JOB_STATUSES as readonly string[]).includes(status);
}

/**
 * A job starts holding locks when it moves from a non-locking status (draft,
 * completed, denied) to a locking one (upcoming, ready). Draft jobs hold no
 * locks, so availability must be re-checked at that moment.
 */
export function startsHoldingLocks(from: JobStatus, to: JobStatus): boolean {
  return !isLockingStatus(from) && isLockingStatus(to);
}

export type DemandLine = {
  itemType: JobInventoryItemType;
  itemId: string;
  quantity: number;
};

export type InventoryConflict = {
  itemType: JobInventoryItemType;
  itemId: string;
  needed: number;
  total: number;
  lockedElsewhere: number;
  available: number;
};

const key = (itemType: JobInventoryItemType, itemId: string) =>
  `${itemType}:${itemId}`;

/**
 * Pure check: sum this job's demand per item (several lines can point at the
 * same item) and compare with `total - lockedElsewhere`.
 */
export function findInventoryConflicts(args: {
  lines: DemandLine[];
  totals: ReadonlyMap<string, number>;
  lockedElsewhere: ReadonlyMap<string, number>;
}): InventoryConflict[] {
  const needed = new Map<string, DemandLine & { quantity: number }>();
  for (const line of args.lines) {
    const k = key(line.itemType, line.itemId);
    const existing = needed.get(k);
    if (existing) existing.quantity += line.quantity;
    else needed.set(k, { ...line });
  }

  const conflicts: InventoryConflict[] = [];
  for (const [k, demand] of needed) {
    const total = args.totals.get(k) ?? 0;
    const lockedElsewhere = args.lockedElsewhere.get(k) ?? 0;
    const available = Math.max(0, total - lockedElsewhere);
    if (demand.quantity > available) {
      conflicts.push({
        itemType: demand.itemType,
        itemId: demand.itemId,
        needed: demand.quantity,
        total,
        lockedElsewhere,
        available,
      });
    }
  }
  return conflicts;
}

export function describeConflicts(
  inventory: InventoryConflict[],
  vehicleIds: string[]
): string {
  const parts: string[] = [];
  for (const c of inventory) {
    parts.push(
      `${c.needed} needed but only ${c.available} available for inventory item ${c.itemId} (${c.total} total, ${c.lockedElsewhere} locked on other jobs)`
    );
  }
  for (const id of vehicleIds) {
    parts.push(`vehicle ${id} is locked on another job`);
  }
  return `Cannot make this job upcoming: ${parts.join("; ")}`;
}

/**
 * Throws if this job's inventory lines or fleet assignments would exceed what
 * is free once it holds locks. Call before moving a job into upcoming/ready.
 */
export async function assertJobCanHoldLocks(args: {
  orgId: string;
  jobId: string;
}): Promise<void> {
  const { orgId, jobId } = args;

  const [lineRows, fleetRows] = await Promise.all([
    withOrgQuery<
      {
        itemType: JobInventoryItemType;
        clientItemId: string | null;
        orgItemId: string | null;
        quantityAssigned: number;
      }[]
    >(orgId, (database) =>
      database
        .select({
          itemType: jobInventoryLines.itemType,
          clientItemId: jobInventoryLines.clientItemId,
          orgItemId: jobInventoryLines.orgItemId,
          quantityAssigned: jobInventoryLines.quantityAssigned,
        })
        .from(jobInventoryLines)
        .where(
          and(
            eq(jobInventoryLines.jobId, jobId),
            eq(jobInventoryLines.orgId, orgId)
          )
        )
    ),
    withOrgQuery<{ fleetVehicleId: string }[]>(orgId, (database) =>
      database
        .select({ fleetVehicleId: jobFleetAssignments.fleetVehicleId })
        .from(jobFleetAssignments)
        .where(
          and(
            eq(jobFleetAssignments.jobId, jobId),
            eq(jobFleetAssignments.orgId, orgId)
          )
        )
    ),
  ]);

  const lines: DemandLine[] = [];
  for (const row of lineRows) {
    const itemId = row.itemType === "client" ? row.clientItemId : row.orgItemId;
    if (!itemId) continue;
    lines.push({
      itemType: row.itemType,
      itemId,
      quantity: row.quantityAssigned,
    });
  }

  const distinct = new Map<string, DemandLine>();
  for (const line of lines) distinct.set(key(line.itemType, line.itemId), line);

  const totals = new Map<string, number>();
  const lockedElsewhere = new Map<string, number>();
  await Promise.all(
    [...distinct.entries()].map(async ([k, line]) => {
      const [total, locked] = await Promise.all([
        getItemTotalQuantity({
          orgId,
          itemType: line.itemType,
          itemId: line.itemId,
        }),
        getLockedQuantity({
          orgId,
          itemType: line.itemType,
          itemId: line.itemId,
          excludeJobId: jobId,
        }),
      ]);
      totals.set(k, total);
      lockedElsewhere.set(k, locked);
    })
  );

  const inventoryConflicts = findInventoryConflicts({
    lines,
    totals,
    lockedElsewhere,
  });

  const vehicleConflicts: string[] = [];
  await Promise.all(
    fleetRows.map(async ({ fleetVehicleId }) => {
      const { locked } = await isFleetVehicleLocked({
        orgId,
        fleetVehicleId,
        excludeJobId: jobId,
      });
      if (locked) vehicleConflicts.push(fleetVehicleId);
    })
  );

  if (inventoryConflicts.length > 0 || vehicleConflicts.length > 0) {
    throw new Error(describeConflicts(inventoryConflicts, vehicleConflicts));
  }
}
