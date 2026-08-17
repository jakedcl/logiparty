"use server";

import { randomUUID } from "crypto";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { maybePromoteJobToReady } from "@/lib/jobs/auto-ready";
import {
  clientCompanies,
  JOB_STATUSES,
  jobs,
  orgMemberships,
  users,
  type ClientCompany,
  type Job,
  type JobStatus,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireJobsAccess() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

function parseOptionalDate(raw: FormDataEntryValue | null): Date | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d;
}

function parseStatus(raw: FormDataEntryValue | null): JobStatus {
  const value = String(raw ?? "");
  if (!(JOB_STATUSES as readonly string[]).includes(value)) {
    throw new Error("Invalid status");
  }
  return value as JobStatus;
}

function jobFieldsFromForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const clientCompanyId = formData.get("clientCompanyId") as string;
  const status = parseStatus(formData.get("status"));
  const clientPocName =
    (formData.get("clientPocName") as string)?.trim() || null;
  const clientPocPhone =
    (formData.get("clientPocPhone") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const jobLeadRaw = String(formData.get("jobLeadUserId") ?? "").trim();
  const jobLeadUserId = jobLeadRaw.length > 0 ? jobLeadRaw : null;

  if (!name) throw new Error("Name is required");
  if (!clientCompanyId) throw new Error("Client company is required");

  return {
    name,
    clientCompanyId,
    status,
    clientPocName,
    clientPocPhone,
    notes,
    jobLeadUserId,
    jobStart: parseOptionalDate(formData.get("jobStart")),
    jobEnd: parseOptionalDate(formData.get("jobEnd")),
    loadInStart: parseOptionalDate(formData.get("loadInStart")),
    loadInEnd: parseOptionalDate(formData.get("loadInEnd")),
    loadOutStart: parseOptionalDate(formData.get("loadOutStart")),
    loadOutEnd: parseOptionalDate(formData.get("loadOutEnd")),
  };
}

export async function listJobClientCompanies(
  orgId: string
): Promise<ClientCompany[]> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<ClientCompany[]>(orgId, (database) =>
    database
      .select()
      .from(clientCompanies)
      .where(eq(clientCompanies.orgId, orgId))
      .orderBy(asc(clientCompanies.name))
  );
}

export async function listJobs(orgId: string): Promise<Job[]> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(eq(jobs.orgId, orgId))
      .orderBy(desc(jobs.createdAt))
  );
}

export async function listJobLeadCandidates(orgId: string): Promise<
  { userId: string; label: string }[]
> {
  await requireJobsAccess();
  if (!db) return [];

  const rows = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(orgMemberships)
    .innerJoin(users, eq(orgMemberships.userId, users.id))
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        or(
          eq(orgMemberships.isStaff, true),
          eq(orgMemberships.isManager, true)
        )
      )
    )
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.email));

  return rows.map((r) => {
    const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
    return { userId: r.userId, label: name || r.email };
  });
}

export async function getJob(orgId: string, jobId: string): Promise<Job | null> {
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  const rows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
      .limit(1)
  );
  return rows[0] ?? null;
}

export async function createJob(formData: FormData) {
  const session = await requireJobsAccess();
  const fields = jobFieldsFromForm(formData);
  const id = randomUUID();

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(jobs).values({
      id,
      orgId: session.user.orgId,
      createdBy: session.user.id,
      ...fields,
      updatedAt: new Date(),
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId: id,
      action: `Created job "${fields.name}"`,
      entityType: "job",
      entityId: id,
      metadata: {
        status: fields.status,
        clientCompanyId: fields.clientCompanyId,
      },
    }),
  ]);

  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${id}`);
}

export async function updateJob(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing job id");

  const fields = jobFieldsFromForm(formData);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(jobs)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.orgId, session.user.orgId))),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId: id,
      action: `Updated job "${fields.name}"`,
      entityType: "job",
      entityId: id,
      metadata: {
        status: fields.status,
        clientCompanyId: fields.clientCompanyId,
      },
    }),
  ]);

  if (fields.status === "upcoming") {
    await maybePromoteJobToReady({
      orgId: session.user.orgId,
      jobId: id,
      actorUserId: session.user.id,
    });
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${id}`);
  redirect(`/dashboard/jobs/${id}`);
}

export async function acceptDraftJob(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing job id");

  const job = await getJob(session.user.orgId, id);
  if (!job) throw new Error("Job not found");
  if (job.status !== "draft") {
    throw new Error("Only draft requests can be accepted");
  }

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(jobs)
      .set({ status: "upcoming", updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.orgId, session.user.orgId))),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId: id,
      action: `Accepted job request "${job.name}"`,
      entityType: "job",
      entityId: id,
      isClientVisible: true,
      metadata: { from: "draft", to: "upcoming" },
    }),
  ]);

  await maybePromoteJobToReady({
    orgId: session.user.orgId,
    jobId: id,
    actorUserId: session.user.id,
  });

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${id}`);
  revalidatePath("/portal/jobs");
  revalidatePath(`/portal/jobs/${id}`);
  redirect(`/dashboard/jobs/${id}`);
}

export async function deleteJob(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing job id");

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.orgId, session.user.orgId))),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId: id,
      action: "Deleted job",
      entityType: "job",
      entityId: id,
    }),
  ]);

  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}
