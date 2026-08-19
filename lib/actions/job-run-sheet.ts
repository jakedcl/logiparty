"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { canManageJobs, canViewMyJobs } from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  ASSIGNMENT_PHASES,
  clientCompanies,
  clientInventoryItems,
  fleetVehicles,
  inventoryItems,
  jobAssignments,
  jobFleetAssignments,
  jobInventoryLines,
  jobLocations,
  documents,
  jobs,
  users,
  type AssignmentPhase,
  type Job,
  type JobLocation,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

export type JobRunSheet = {
  job: Job;
  clientCompanyName: string;
  jobLeadLabel: string | null;
  locations: JobLocation[];
  inventory: {
    id: string;
    itemType: string;
    itemName: string;
    itemSku: string | null;
    quantityAssigned: number;
    quantityLoaded: number;
  }[];
  fleet: { vehicleName: string; vehiclePlate: string | null }[];
  crewByPhase: {
    phase: AssignmentPhase;
    members: { userLabel: string; assignedRole: string }[];
  }[];
  /** Document uploads land in M4 — empty until then. */
  documentNames: string[];
};

async function assertCanViewRunSheet(orgId: string, jobId: string, userId: string) {
  const session = await requireSession();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  if (canManageJobs(session.user)) return session;

  if (!canViewMyJobs(session.user)) throw new Error("Forbidden");

  const mine = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .select({ id: jobAssignments.id })
      .from(jobAssignments)
      .where(
        and(
          eq(jobAssignments.orgId, orgId),
          eq(jobAssignments.jobId, jobId),
          eq(jobAssignments.userId, userId)
        )
      )
      .limit(1)
  );
  if (!mine[0]) throw new Error("Forbidden");
  return session;
}

export async function getJobRunSheet(
  orgId: string,
  jobId: string
): Promise<JobRunSheet | null> {
  const session = await requireSession();
  await assertCanViewRunSheet(orgId, jobId, session.user.id);

  const jobRows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  const job = jobRows[0];
  if (!job) return null;

  const [
    companies,
    locations,
    lines,
    clientItems,
    orgItems,
    fleetRows,
    crewRows,
    docRows,
  ] = await Promise.all([
    withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
      database
        .select({ id: clientCompanies.id, name: clientCompanies.name })
        .from(clientCompanies)
        .where(eq(clientCompanies.orgId, orgId))
    ),
    withOrgQuery<JobLocation[]>(orgId, (database) =>
      database
        .select()
        .from(jobLocations)
        .where(
          and(eq(jobLocations.jobId, jobId), eq(jobLocations.orgId, orgId))
        )
        .orderBy(asc(jobLocations.sortOrder))
    ),
    withOrgQuery<(typeof jobInventoryLines.$inferSelect)[]>(orgId, (database) =>
      database
        .select()
        .from(jobInventoryLines)
        .where(
          and(
            eq(jobInventoryLines.jobId, jobId),
            eq(jobInventoryLines.orgId, orgId)
          )
        )
        .orderBy(asc(jobInventoryLines.itemType))
    ),
    withOrgQuery<(typeof clientInventoryItems.$inferSelect)[]>(
      orgId,
      (database) =>
        database
          .select()
          .from(clientInventoryItems)
          .where(eq(clientInventoryItems.orgId, orgId))
    ),
    withOrgQuery<(typeof inventoryItems.$inferSelect)[]>(orgId, (database) =>
      database
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.orgId, orgId))
    ),
    withOrgQuery<
      { vehicleName: string; vehiclePlate: string | null }[]
    >(orgId, (database) =>
      database
        .select({
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
    ),
    withOrgQuery<(typeof jobAssignments.$inferSelect)[]>(orgId, (database) =>
      database
        .select()
        .from(jobAssignments)
        .where(
          and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.orgId, orgId))
        )
        .orderBy(asc(jobAssignments.phase), asc(jobAssignments.createdAt))
    ),
    withOrgQuery<{ fileName: string }[]>(orgId, (database) =>
      database
        .select({ fileName: documents.fileName })
        .from(documents)
        .where(and(eq(documents.jobId, jobId), eq(documents.orgId, orgId)))
        .orderBy(asc(documents.createdAt))
    ),
  ]);

  const clientById = new Map(clientItems.map((i) => [i.id, i]));
  const orgById = new Map(orgItems.map((i) => [i.id, i]));

  const inventory = lines.map((line) => {
    if (line.itemType === "client" && line.clientItemId) {
      const item = clientById.get(line.clientItemId);
      return {
        id: line.id,
        itemType: line.itemType,
        itemName: item?.name ?? "Unknown client item",
        itemSku: item?.sku ?? null,
        quantityAssigned: line.quantityAssigned,
        quantityLoaded: line.quantityLoaded,
      };
    }
    const item = line.orgItemId ? orgById.get(line.orgItemId) : undefined;
    return {
      id: line.id,
      itemType: line.itemType,
      itemName: item?.name ?? "Unknown our inventory item",
      itemSku: item?.sku ?? null,
      quantityAssigned: line.quantityAssigned,
      quantityLoaded: line.quantityLoaded,
    };
  });

  const userIds = [
    ...new Set(
      [
        ...crewRows.map((r) => r.userId),
        job.jobLeadUserId,
      ].filter((id): id is string => Boolean(id))
    ),
  ];

  const people =
    userIds.length === 0
      ? []
      : await db!
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, userIds));

  const peopleById = new Map(people.map((u) => [u.id, u]));

  const crewByPhase = ASSIGNMENT_PHASES.map((phase) => ({
    phase,
    members: crewRows
      .filter((r) => r.phase === phase)
      .map((r) => {
        const u = peopleById.get(r.userId);
        return {
          userLabel: u ? displayName(u) : "Unknown user",
          assignedRole: r.assignedRole,
        };
      }),
  })).filter((g) => g.members.length > 0);

  const lead = job.jobLeadUserId
    ? peopleById.get(job.jobLeadUserId)
    : undefined;

  return {
    job,
    clientCompanyName:
      companies.find((c) => c.id === job.clientCompanyId)?.name ?? "Client",
    jobLeadLabel: lead ? displayName(lead) : null,
    locations,
    inventory,
    fleet: fleetRows,
    crewByPhase,
    documentNames: docRows.map((d) => d.fileName),
  };
}
