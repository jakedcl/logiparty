"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import {
  canAccessClientPortal,
  canDeleteDocuments,
  canManageJobs,
  canUploadDocuments,
} from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  documents,
  jobs,
  type Document,
  type UploaderRole,
} from "@/lib/db/schema";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";
import {
  assertAllowedUpload,
  deleteJobObject,
  getObjectDownloadUrl,
  putJobObject,
} from "@/lib/storage/r2";

export type JobDocumentView = Document & { downloadUrl: string | null };

async function assertCanAccessJob(orgId: string, jobId: string) {
  const session = await requireSession();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const jobRows = await withOrgQuery<(typeof jobs.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
        .limit(1)
  );
  const job = jobRows[0];
  if (!job) throw new Error("Job not found");

  if (canManageJobs(session.user)) return { session, job };

  if (canAccessClientPortal(session.user)) {
    const company = await getSessionClientCompany(session);
    if (!company || company.id !== job.clientCompanyId) {
      throw new Error("Forbidden");
    }
    return { session, job };
  }

  throw new Error("Forbidden");
}

export async function listJobDocuments(
  orgId: string,
  jobId: string
): Promise<JobDocumentView[]> {
  await assertCanAccessJob(orgId, jobId);

  const rows = await withOrgQuery<Document[]>(orgId, (database) =>
    database
      .select()
      .from(documents)
      .where(and(eq(documents.jobId, jobId), eq(documents.orgId, orgId)))
      .orderBy(asc(documents.createdAt))
  );

  return Promise.all(
    rows.map(async (doc) => {
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await getObjectDownloadUrl(doc.storageKey);
      } catch {
        downloadUrl = null;
      }
      return { ...doc, downloadUrl };
    })
  );
}

export async function uploadJobDocument(formData: FormData) {
  const session = await requireSession();
  if (!canUploadDocuments(session.user)) throw new Error("Forbidden");

  const jobId = formData.get("jobId") as string;
  if (!jobId) throw new Error("Missing job id");

  const { job } = await assertCanAccessJob(session.user.orgId, jobId);

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Choose a file to upload");
  assertAllowedUpload(file);

  const uploaderRole: UploaderRole = canManageJobs(session.user)
    ? "manager"
    : "client";
  const id = randomUUID();
  const stored = await putJobObject({
    orgId: session.user.orgId,
    jobId,
    documentId: id,
    file,
  });

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(documents).values({
      id,
      orgId: session.user.orgId,
      jobId,
      uploadedBy: session.user.id,
      uploaderRole,
      fileName: file.name.slice(0, 200),
      storageKey: stored.storageKey,
      fileSizeBytes: stored.size,
      mimeType: stored.mimeType,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Uploaded document "${file.name}"`,
      entityType: "document",
      entityId: id,
      isClientVisible: true,
      metadata: {
        fileName: file.name,
        uploaderRole,
        clientCompanyId: job.clientCompanyId,
      },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath(`/portal/jobs/${jobId}`);
}

export async function deleteJobDocument(formData: FormData) {
  const session = await requireSession();
  if (!canDeleteDocuments(session.user)) throw new Error("Forbidden");

  const jobId = formData.get("jobId") as string;
  const id = formData.get("id") as string;
  if (!jobId || !id) throw new Error("Missing document id");

  await assertCanAccessJob(session.user.orgId, jobId);

  const rows = await withOrgQuery<Document[]>(session.user.orgId, (database) =>
    database
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.jobId, jobId),
          eq(documents.orgId, session.user.orgId)
        )
      )
      .limit(1)
  );
  const doc = rows[0];
  if (!doc) throw new Error("Document not found");

  const isManager = canManageJobs(session.user);
  if (!isManager && doc.uploadedBy !== session.user.id) {
    throw new Error("You can only delete documents you uploaded");
  }

  try {
    await deleteJobObject(doc.storageKey);
  } catch {
    // Still remove DB row if object already gone
  }

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.jobId, jobId),
          eq(documents.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `Deleted document "${doc.fileName}"`,
      entityType: "document",
      entityId: id,
      isClientVisible: true,
      metadata: { fileName: doc.fileName },
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath(`/portal/jobs/${jobId}`);
}
