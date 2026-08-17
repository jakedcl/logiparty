"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  fleetVehicles,
  jobFleetAssignments,
  jobs,
  type FleetVehicle,
  type JobFleetAssignment,
} from "@/lib/db/schema";
import { assertFleetAssignable } from "@/lib/jobs/fleet-locks";
import { requireSession } from "@/lib/org/context";

async function requireJobsAccess() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function getJobOrThrow(orgId: string, jobId: string) {
  const rows = await withOrgQuery<(typeof jobs.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
        .limit(1)
  );
  if (!rows[0]) throw new Error("Job not found");
  return rows[0];
}

export type JobFleetAssignmentView = JobFleetAssignment & {
  vehicleName: string;
  vehiclePlate: string | null;
};

export async function listJobFleetAssignments(
  orgId: string,
  jobId: string
): Promise<JobFleetAssignmentView[]> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  await getJobOrThrow(orgId, jobId);

  const rows = await withOrgQuery<
    {
      jobId: string;
      fleetVehicleId: string;
      orgId: string;
      vehicleName: string;
      vehiclePlate: string | null;
    }[]
  >(orgId, (database) =>
    database
      .select({
        jobId: jobFleetAssignments.jobId,
        fleetVehicleId: jobFleetAssignments.fleetVehicleId,
        orgId: jobFleetAssignments.orgId,
        vehicleName: fleetVehicles.name,
        vehiclePlate: fleetVehicles.plate,
      })
      .from(jobFleetAssignments)
      .innerJoin(
        fleetVehicles,
        eq(jobFleetAssignments.fleetVehicleId, fleetVehicles.id)
      )
      .where(
        and(
          eq(jobFleetAssignments.jobId, jobId),
          eq(jobFleetAssignments.orgId, orgId)
        )
      )
      .orderBy(asc(fleetVehicles.name))
  );

  return rows;
}

export async function listAssignableFleetVehicles(
  orgId: string,
  jobId: string
): Promise<FleetVehicle[]> {
  await requireJobsAccess();
  await getJobOrThrow(orgId, jobId);

  const [vehicles, assigned] = await Promise.all([
    withOrgQuery<FleetVehicle[]>(orgId, (database) =>
      database
        .select()
        .from(fleetVehicles)
        .where(
          and(
            eq(fleetVehicles.orgId, orgId),
            eq(fleetVehicles.isActive, true)
          )
        )
        .orderBy(asc(fleetVehicles.name))
    ),
    withOrgQuery<JobFleetAssignment[]>(orgId, (database) =>
      database
        .select()
        .from(jobFleetAssignments)
        .where(
          and(
            eq(jobFleetAssignments.jobId, jobId),
            eq(jobFleetAssignments.orgId, orgId)
          )
        )
    ),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.fleetVehicleId));
  return vehicles.filter((v) => !assignedIds.has(v.id));
}

export async function assignFleetToJob(formData: FormData) {
  const session = await requireJobsAccess();
  const jobId = formData.get("jobId") as string;
  const fleetVehicleId = formData.get("fleetVehicleId") as string;
  if (!jobId || !fleetVehicleId) throw new Error("Missing job or vehicle");

  await getJobOrThrow(session.user.orgId, jobId);

  const vehicles = await withOrgQuery<FleetVehicle[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(fleetVehicles)
        .where(
          and(
            eq(fleetVehicles.id, fleetVehicleId),
            eq(fleetVehicles.orgId, session.user.orgId),
            eq(fleetVehicles.isActive, true)
          )
        )
        .limit(1)
  );
  if (!vehicles[0]) throw new Error("Active fleet vehicle not found");

  await assertFleetAssignable({
    orgId: session.user.orgId,
    jobId,
    fleetVehicleId,
  });

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(jobFleetAssignments).values({
      jobId,
      fleetVehicleId,
      orgId: session.user.orgId,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Assigned fleet vehicle "${vehicles[0].name}"`,
      entityType: "job_fleet_assignment",
      entityId: fleetVehicleId,
      metadata: { fleetVehicleId, name: vehicles[0].name },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function unassignFleetFromJob(formData: FormData) {
  const session = await requireJobsAccess();
  const jobId = formData.get("jobId") as string;
  const fleetVehicleId = formData.get("fleetVehicleId") as string;
  if (!jobId || !fleetVehicleId) throw new Error("Missing job or vehicle");

  await getJobOrThrow(session.user.orgId, jobId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobFleetAssignments)
      .where(
        and(
          eq(jobFleetAssignments.jobId, jobId),
          eq(jobFleetAssignments.fleetVehicleId, fleetVehicleId),
          eq(jobFleetAssignments.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Unassigned fleet vehicle from job",
      entityType: "job_fleet_assignment",
      entityId: fleetVehicleId,
      metadata: { fleetVehicleId },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}
