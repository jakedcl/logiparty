import { and, eq, ne } from "drizzle-orm";
import { withOrgQuery } from "@/lib/db";
import { jobFleetAssignments, jobs } from "@/lib/db/schema";
import { lockActiveConditions } from "@/lib/jobs/lock-window";

/** True when this vehicle is locked on another upcoming/ready job. */
export async function isFleetVehicleLocked(args: {
  orgId: string;
  fleetVehicleId: string;
  excludeJobId?: string;
}): Promise<{ locked: boolean; jobId: string | null }> {
  const { orgId, fleetVehicleId, excludeJobId } = args;

  const filters = [
    eq(jobFleetAssignments.orgId, orgId),
    eq(jobFleetAssignments.fleetVehicleId, fleetVehicleId),
    ...lockActiveConditions(),
  ];
  if (excludeJobId) {
    filters.push(ne(jobs.id, excludeJobId));
  }

  const rows = await withOrgQuery<{ jobId: string }[]>(orgId, (database) =>
    database
      .select({ jobId: jobFleetAssignments.jobId })
      .from(jobFleetAssignments)
      .innerJoin(jobs, eq(jobFleetAssignments.jobId, jobs.id))
      .where(and(...filters))
      .limit(1)
  );

  const jobId = rows[0]?.jobId ?? null;
  return { locked: Boolean(jobId), jobId };
}

export async function assertFleetAssignable(args: {
  orgId: string;
  jobId: string;
  fleetVehicleId: string;
}) {
  const { locked, jobId } = await isFleetVehicleLocked({
    orgId: args.orgId,
    fleetVehicleId: args.fleetVehicleId,
    excludeJobId: args.jobId,
  });
  if (locked) {
    throw new Error(
      `Vehicle is locked on another job${jobId ? ` (${jobId})` : ""} until load-out ends or that job completes`
    );
  }
}
