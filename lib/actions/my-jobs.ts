"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { canViewMyJobs } from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  jobAssignments,
  jobInventoryLines,
  jobs,
  type ClientCompany,
  type Job,
  type JobInventoryLine,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireMyJobsAccess() {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

export type MyJobListItem = Job & {
  clientCompanyName: string;
  phases: string[];
};

export async function listMyJobs(orgId: string): Promise<MyJobListItem[]> {
  const session = await requireMyJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const assignments = await withOrgQuery<
    { jobId: string; phase: string }[]
  >(orgId, (database) =>
    database
      .select({
        jobId: jobAssignments.jobId,
        phase: jobAssignments.phase,
      })
      .from(jobAssignments)
      .where(
        and(
          eq(jobAssignments.orgId, orgId),
          eq(jobAssignments.userId, session.user.id)
        )
      )
  );

  if (assignments.length === 0) return [];

  const phasesByJob = new Map<string, string[]>();
  for (const a of assignments) {
    const list = phasesByJob.get(a.jobId) ?? [];
    if (!list.includes(a.phase)) list.push(a.phase);
    phasesByJob.set(a.jobId, list);
  }

  const jobIds = [...phasesByJob.keys()];
  const [jobRows, companies] = await Promise.all([
    withOrgQuery<Job[]>(orgId, (database) =>
      database
        .select()
        .from(jobs)
        .where(and(eq(jobs.orgId, orgId), inArray(jobs.id, jobIds)))
        .orderBy(desc(jobs.jobStart), desc(jobs.createdAt))
    ),
    withOrgQuery<ClientCompany[]>(orgId, (database) =>
      database
        .select()
        .from(clientCompanies)
        .where(eq(clientCompanies.orgId, orgId))
    ),
  ]);

  const companyName = new Map(companies.map((c) => [c.id, c.name]));

  return jobRows.map((job) => ({
    ...job,
    clientCompanyName: companyName.get(job.clientCompanyId) ?? "Client",
    phases: phasesByJob.get(job.id) ?? [],
  }));
}

export async function getMyJob(
  orgId: string,
  jobId: string
): Promise<
  | (Job & {
      clientCompanyName: string;
      myPhases: string[];
      myRoles: string[];
    })
  | null
> {
  const session = await requireMyJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const myAssignments = await withOrgQuery<
    { phase: string; assignedRole: string }[]
  >(orgId, (database) =>
    database
      .select({
        phase: jobAssignments.phase,
        assignedRole: jobAssignments.assignedRole,
      })
      .from(jobAssignments)
      .where(
        and(
          eq(jobAssignments.orgId, orgId),
          eq(jobAssignments.jobId, jobId),
          eq(jobAssignments.userId, session.user.id)
        )
      )
      .orderBy(asc(jobAssignments.phase))
  );

  if (myAssignments.length === 0) return null;

  const jobRows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  const job = jobRows[0];
  if (!job) return null;

  const companies = await withOrgQuery<ClientCompany[]>(orgId, (database) =>
    database
      .select()
      .from(clientCompanies)
      .where(
        and(
          eq(clientCompanies.id, job.clientCompanyId),
          eq(clientCompanies.orgId, orgId)
        )
      )
      .limit(1)
  );

  return {
    ...job,
    clientCompanyName: companies[0]?.name ?? "Client",
    myPhases: myAssignments.map((a) => a.phase),
    myRoles: myAssignments.map((a) => a.assignedRole),
  };
}

export async function listMyJobInventory(
  orgId: string,
  jobId: string
): Promise<JobInventoryLine[]> {
  const session = await requireMyJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const access = await getMyJob(orgId, jobId);
  if (!access) throw new Error("Forbidden");

  return withOrgQuery<JobInventoryLine[]>(orgId, (database) =>
    database
      .select()
      .from(jobInventoryLines)
      .where(
        and(
          eq(jobInventoryLines.jobId, jobId),
          eq(jobInventoryLines.orgId, orgId)
        )
      )
  );
}
