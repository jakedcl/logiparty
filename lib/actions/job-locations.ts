"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { jobLocations, jobs, type JobLocation } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

const MAX_LOCATIONS = 5;

async function requireJobsAccess() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function assertJobInOrg(orgId: string, jobId: string) {
  const rows = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  if (!rows[0]) throw new Error("Job not found");
}

export async function listJobLocations(
  orgId: string,
  jobId: string
): Promise<JobLocation[]> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  await assertJobInOrg(orgId, jobId);
  return withOrgQuery<JobLocation[]>(orgId, (database) =>
    database
      .select()
      .from(jobLocations)
      .where(
        and(eq(jobLocations.jobId, jobId), eq(jobLocations.orgId, orgId))
      )
      .orderBy(asc(jobLocations.sortOrder))
  );
}

export async function addJobLocation(formData: FormData) {
  const session = await requireJobsAccess();
  const jobId = formData.get("jobId") as string;
  const label = (formData.get("label") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!jobId) throw new Error("Missing job id");
  if (!label) throw new Error("Label is required");
  if (!address) throw new Error("Address is required");

  await assertJobInOrg(session.user.orgId, jobId);

  const existing = await listJobLocations(session.user.orgId, jobId);
  if (existing.length >= MAX_LOCATIONS) {
    throw new Error("A job may have at most 5 locations");
  }

  const used = new Set(existing.map((l) => l.sortOrder));
  let sortOrder = 0;
  while (used.has(sortOrder) && sortOrder < MAX_LOCATIONS) sortOrder += 1;
  if (sortOrder >= MAX_LOCATIONS) {
    throw new Error("A job may have at most 5 locations");
  }

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(jobLocations).values({
      id,
      jobId,
      orgId: session.user.orgId,
      label,
      address,
      sortOrder,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Added location "${label}"`,
      entityType: "job_location",
      entityId: id,
      metadata: { label, address, sortOrder },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function updateJobLocation(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  const label = (formData.get("label") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!id || !jobId) throw new Error("Missing location id");
  if (!label) throw new Error("Label is required");
  if (!address) throw new Error("Address is required");

  await assertJobInOrg(session.user.orgId, jobId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(jobLocations)
      .set({ label, address })
      .where(
        and(
          eq(jobLocations.id, id),
          eq(jobLocations.jobId, jobId),
          eq(jobLocations.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Updated location "${label}"`,
      entityType: "job_location",
      entityId: id,
      metadata: { label, address },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function deleteJobLocation(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  if (!id || !jobId) throw new Error("Missing location id");

  await assertJobInOrg(session.user.orgId, jobId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobLocations)
      .where(
        and(
          eq(jobLocations.id, id),
          eq(jobLocations.jobId, jobId),
          eq(jobLocations.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Deleted job location",
      entityType: "job_location",
      entityId: id,
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}
