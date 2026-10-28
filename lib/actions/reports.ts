"use server";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  fleetVehicles,
  inventoryItems,
  jobAssignments,
  jobFleetAssignments,
  jobInventoryLines,
  jobs,
  users,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireReportsAccess() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

export type ReportsPayload = {
  jobsByStatus: { status: string; count: number }[];
  upcomingLoadEvents: {
    id: string;
    name: string;
    kind: "load_in" | "load_out";
    at: Date;
  }[];
  topReservedSkus: { sku: string; name: string; reserved: number }[];
  crewWorkload: { label: string; jobs: number }[];
  fleetUtilization: { name: string; assignments: number }[];
};

export async function loadReports(
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<ReportsPayload> {
  const session = await requireReportsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const jobsByStatus = await withOrgQuery<{ status: string; count: number }[]>(
    orgId,
    (database) =>
      database
        .select({
          status: jobs.status,
          count: count(),
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.orgId, orgId),
            gte(jobs.createdAt, rangeStart),
            lte(jobs.createdAt, rangeEnd)
          )
        )
        .groupBy(jobs.status)
  );

  const upcoming = await withOrgQuery<
    {
      id: string;
      name: string;
      loadInStart: Date | null;
      loadOutStart: Date | null;
    }[]
  >(orgId, (database) =>
    database
      .select({
        id: jobs.id,
        name: jobs.name,
        loadInStart: jobs.loadInStart,
        loadOutStart: jobs.loadOutStart,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.orgId, orgId),
          sql`${jobs.status} IN ('upcoming', 'ready')`
        )
      )
      .orderBy(jobs.loadInStart)
      .limit(12)
  );

  const upcomingLoadEvents: ReportsPayload["upcomingLoadEvents"] = [];
  for (const row of upcoming) {
    if (row.loadInStart) {
      upcomingLoadEvents.push({
        id: row.id,
        name: row.name,
        kind: "load_in",
        at: row.loadInStart,
      });
    }
    if (row.loadOutStart) {
      upcomingLoadEvents.push({
        id: row.id,
        name: row.name,
        kind: "load_out",
        at: row.loadOutStart,
      });
    }
  }
  upcomingLoadEvents.sort((a, b) => a.at.getTime() - b.at.getTime());

  const reserved = await withOrgQuery<
    { sku: string; name: string; reserved: number }[]
  >(orgId, (database) =>
    database
      .select({
        sku: inventoryItems.sku,
        name: inventoryItems.name,
        reserved: sql<number>`coalesce(sum(${jobInventoryLines.quantityAssigned}), 0)::int`,
      })
      .from(jobInventoryLines)
      .innerJoin(inventoryItems, eq(jobInventoryLines.orgItemId, inventoryItems.id))
      .innerJoin(jobs, eq(jobInventoryLines.jobId, jobs.id))
      .where(
        and(
          eq(jobInventoryLines.orgId, orgId),
          sql`${jobs.status} IN ('upcoming', 'ready')`
        )
      )
      .groupBy(inventoryItems.sku, inventoryItems.name)
      .orderBy(desc(sql`sum(${jobInventoryLines.quantityAssigned})`))
      .limit(8)
  );

  const crewRows = await withOrgQuery<
    { userId: string; jobs: number }[]
  >(orgId, (database) =>
    database
      .select({
        userId: jobAssignments.userId,
        jobs: sql<number>`count(distinct ${jobAssignments.jobId})::int`,
      })
      .from(jobAssignments)
      .where(eq(jobAssignments.orgId, orgId))
      .groupBy(jobAssignments.userId)
      .orderBy(desc(sql`count(distinct ${jobAssignments.jobId})`))
      .limit(10)
  );

  const crewPeople =
    crewRows.length === 0
      ? []
      : await db!
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(
            sql`${users.id} IN (${sql.join(
              crewRows.map((r) => sql`${r.userId}`),
              sql`, `
            )})`
          );

  const crewWorkload = crewRows.map((row) => {
    const u = crewPeople.find((p) => p.id === row.userId);
    const label =
      u &&
      ([u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email);
    return { label: label || "Crew", jobs: row.jobs };
  });

  const fleetRows = await withOrgQuery<
    { vehicleId: string; assignments: number }[]
  >(orgId, (database) =>
    database
      .select({
        vehicleId: jobFleetAssignments.fleetVehicleId,
        assignments: count(),
      })
      .from(jobFleetAssignments)
      .where(eq(jobFleetAssignments.orgId, orgId))
      .groupBy(jobFleetAssignments.fleetVehicleId)
      .orderBy(desc(count()))
      .limit(8)
  );

  const fleetNames =
    fleetRows.length === 0
      ? []
      : await withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
          database
            .select({ id: fleetVehicles.id, name: fleetVehicles.name })
            .from(fleetVehicles)
            .where(eq(fleetVehicles.orgId, orgId))
        );

  const fleetUtilization = fleetRows.map((row) => ({
    name: fleetNames.find((f) => f.id === row.vehicleId)?.name ?? "Vehicle",
    assignments: row.assignments,
  }));

  return {
    jobsByStatus: jobsByStatus.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    upcomingLoadEvents: upcomingLoadEvents.slice(0, 10),
    topReservedSkus: reserved.map((r) => ({
      sku: r.sku,
      name: r.name,
      reserved: Number(r.reserved),
    })),
    crewWorkload,
    fleetUtilization,
  };
}

export async function exportReportsCsv(
  orgId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<string> {
  const data = await loadReports(orgId, rangeStart, rangeEnd);
  const lines: string[] = ["section,key,value"];
  for (const row of data.jobsByStatus) {
    lines.push(`jobs_by_status,${row.status},${row.count}`);
  }
  for (const row of data.crewWorkload) {
    lines.push(`crew_workload,"${row.label.replace(/"/g, '""')}",${row.jobs}`);
  }
  for (const row of data.topReservedSkus) {
    lines.push(
      `inventory_reserved,${row.sku},${row.reserved}`
    );
  }
  return lines.join("\n");
}
