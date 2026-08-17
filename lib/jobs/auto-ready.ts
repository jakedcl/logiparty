import { and, eq } from "drizzle-orm";
import { activityLogInsert } from "@/lib/activity/log";
import { withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  jobAssignments,
  jobFleetAssignments,
  jobInventoryLines,
  jobs,
  type Job,
} from "@/lib/db/schema";

export type AutoReadyCheck = {
  eligible: boolean;
  reasons: string[];
  hasLoadIn: boolean;
  hasLoadOut: boolean;
  hasFleet: boolean;
  inventoryFullyLoaded: boolean;
};

export async function evaluateAutoReady(
  orgId: string,
  jobId: string
): Promise<AutoReadyCheck> {
  const jobRows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  if (!jobRows[0]) {
    return {
      eligible: false,
      reasons: ["Job not found"],
      hasLoadIn: false,
      hasLoadOut: false,
      hasFleet: false,
      inventoryFullyLoaded: false,
    };
  }

  const [crew, fleet, inventory] = await Promise.all([
    withOrgQuery<{ phase: string }[]>(orgId, (database) =>
      database
        .select({ phase: jobAssignments.phase })
        .from(jobAssignments)
        .where(
          and(
            eq(jobAssignments.jobId, jobId),
            eq(jobAssignments.orgId, orgId)
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
        .limit(1)
    ),
    withOrgQuery<
      { quantityAssigned: number; quantityLoaded: number }[]
    >(orgId, (database) =>
      database
        .select({
          quantityAssigned: jobInventoryLines.quantityAssigned,
          quantityLoaded: jobInventoryLines.quantityLoaded,
        })
        .from(jobInventoryLines)
        .where(
          and(
            eq(jobInventoryLines.jobId, jobId),
            eq(jobInventoryLines.orgId, orgId)
          )
        )
    ),
  ]);

  const hasLoadIn = crew.some((c) => c.phase === "LoadIn");
  const hasLoadOut = crew.some((c) => c.phase === "LoadOut");
  const hasFleet = fleet.length > 0;
  const assignedLines = inventory.filter((l) => l.quantityAssigned > 0);
  // Vacuous true when no assigned lines (APP rule is universal over assigned lines).
  const inventoryFullyLoaded = assignedLines.every(
    (l) => l.quantityLoaded >= l.quantityAssigned
  );

  const reasons: string[] = [];
  if (!hasLoadIn) reasons.push("Need ≥1 LoadIn crew assignment");
  if (!hasLoadOut) reasons.push("Need ≥1 LoadOut crew assignment");
  if (!hasFleet) reasons.push("Need ≥1 fleet vehicle");
  if (!inventoryFullyLoaded) {
    reasons.push("All assigned inventory must be fully loaded");
  }

  return {
    eligible: hasLoadIn && hasLoadOut && hasFleet && inventoryFullyLoaded,
    reasons,
    hasLoadIn,
    hasLoadOut,
    hasFleet,
    inventoryFullyLoaded,
  };
}

/**
 * If job is `upcoming` and auto-ready rules pass, promote to `ready`.
 * Does not demote from ready. Returns true when status changed.
 */
export async function maybePromoteJobToReady(args: {
  orgId: string;
  jobId: string;
  actorUserId: string;
}): Promise<boolean> {
  const { orgId, jobId, actorUserId } = args;

  const jobRows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  const job = jobRows[0];
  if (!job || job.status !== "upcoming") return false;

  const check = await evaluateAutoReady(orgId, jobId);
  if (!check.eligible) return false;

  await withOrgQueries(orgId, (database) => [
    database
      .update(jobs)
      .set({ status: "ready", updatedAt: new Date() })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.orgId, orgId),
          eq(jobs.status, "upcoming")
        )
      ),
    activityLogInsert(database, {
      orgId,
      userId: actorUserId,
      jobId,
      action: "Auto-promoted job to ready",
      entityType: "job",
      entityId: jobId,
      metadata: {
        hasLoadIn: check.hasLoadIn,
        hasLoadOut: check.hasLoadOut,
        hasFleet: check.hasFleet,
        inventoryFullyLoaded: check.inventoryFullyLoaded,
      },
    }),
  ]);

  return true;
}
