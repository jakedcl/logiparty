"use server";

import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canAccessClientPortal } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import { jobs, type Job } from "@/lib/db/schema";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

async function requirePortalClient() {
  const session = await requireSession();
  if (!canAccessClientPortal(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  const company = await getSessionClientCompany(session);
  if (!company) throw new Error("Your account is not linked to a client company");
  return { session, company };
}

function parseOptionalDate(raw: FormDataEntryValue | null): Date | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d;
}

export async function listPortalJobs(orgId: string): Promise<Job[]> {
  const { session, company } = await requirePortalClient();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  return withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(
        and(eq(jobs.orgId, orgId), eq(jobs.clientCompanyId, company.id))
      )
      .orderBy(desc(jobs.jobStart), desc(jobs.createdAt))
  );
}

export async function getPortalJob(
  orgId: string,
  jobId: string
): Promise<Job | null> {
  const { session, company } = await requirePortalClient();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const rows = await withOrgQuery<Job[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.orgId, orgId),
          eq(jobs.clientCompanyId, company.id)
        )
      )
      .limit(1)
  );
  return rows[0] ?? null;
}

/** Client job request → draft. Clients cannot edit after submit (D4). */
export async function requestJob(formData: FormData) {
  const { session, company } = await requirePortalClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required");

  const clientPocName =
    (formData.get("clientPocName") as string)?.trim() || null;
  const clientPocPhone =
    (formData.get("clientPocPhone") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const id = randomUUID();

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(jobs).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId: company.id,
      name,
      status: "draft",
      clientPocName,
      clientPocPhone,
      notes,
      jobStart: parseOptionalDate(formData.get("jobStart")),
      jobEnd: parseOptionalDate(formData.get("jobEnd")),
      loadInStart: parseOptionalDate(formData.get("loadInStart")),
      loadInEnd: parseOptionalDate(formData.get("loadInEnd")),
      loadOutStart: parseOptionalDate(formData.get("loadOutStart")),
      loadOutEnd: parseOptionalDate(formData.get("loadOutEnd")),
      createdBy: session.user.id,
      updatedAt: new Date(),
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId: id,
      action: `Submitted job request "${name}"`,
      entityType: "job",
      entityId: id,
      isClientVisible: true,
      metadata: { status: "draft", clientCompanyId: company.id },
    }),
  ]);

  revalidatePath("/portal/jobs");
  revalidatePath("/dashboard/jobs");
  redirect(`/portal/jobs/${id}`);
}
