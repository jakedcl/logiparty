"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { notifyManagers, notifyUser } from "@/lib/email/notify";
import { canManageJobs, canViewMyJobs } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  ASSIGNMENT_PHASES,
  ASSIGNMENT_ROLES,
  jobAssignments,
  jobs,
  orgMemberships,
  users,
  type AssignmentPhase,
  type AssignmentRole,
  type JobAssignment,
} from "@/lib/db/schema";
import { maybePromoteJobToReady } from "@/lib/jobs/auto-ready";
import {
  getUsersWithApprovedTimeOff,
  jobAssignmentWindow,
} from "@/lib/jobs/availability-blocks";
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

function parsePhase(raw: FormDataEntryValue | null): AssignmentPhase {
  const value = String(raw ?? "");
  if (!(ASSIGNMENT_PHASES as readonly string[]).includes(value)) {
    throw new Error("Invalid phase");
  }
  return value as AssignmentPhase;
}

function parseRole(raw: FormDataEntryValue | null): AssignmentRole {
  const value = String(raw ?? "");
  if (!(ASSIGNMENT_ROLES as readonly string[]).includes(value)) {
    throw new Error("Invalid role");
  }
  return value as AssignmentRole;
}

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

export type CrewCandidate = {
  userId: string;
  label: string;
  email: string;
};

/** Staff only — manager-only memberships are excluded (D10). */
export async function listCrewCandidates(
  orgId: string,
  jobId?: string
): Promise<CrewCandidate[]> {
  await requireJobsAccess();
  if (!db) return [];

  let blocked = new Set<string>();
  if (jobId) {
    const jobRows = await withOrgQuery<(typeof jobs.$inferSelect)[]>(
      orgId,
      (database) =>
        database
          .select()
          .from(jobs)
          .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
          .limit(1)
    );
    const window = jobRows[0] ? jobAssignmentWindow(jobRows[0]) : null;
    if (window) {
      blocked = await getUsersWithApprovedTimeOff({
        orgId,
        windowStart: window.start,
        windowEnd: window.end,
      });
    }
  }

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
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.isStaff, true))
    )
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.email));

  return rows
    .filter((r) => !blocked.has(r.userId))
    .map((r) => ({
    userId: r.userId,
    email: r.email,
    label: displayName(r),
  }));
}

export type JobAssignmentView = JobAssignment & {
  userLabel: string;
  userEmail: string;
};

export async function listJobAssignments(
  orgId: string,
  jobId: string
): Promise<JobAssignmentView[]> {
  const session = await requireSession();
  const manager = canManageJobs(session.user);
  if (!manager && !canViewMyJobs(session.user)) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (manager) {
    await getJobOrThrow(orgId, jobId);
  } else {
    const mine = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
      database
        .select({ id: jobAssignments.id })
        .from(jobAssignments)
        .where(
          and(
            eq(jobAssignments.jobId, jobId),
            eq(jobAssignments.orgId, orgId),
            eq(jobAssignments.userId, session.user.id)
          )
        )
        .limit(1)
    );
    if (!mine[0]) throw new Error("Forbidden");
  }

  const rows = await withOrgQuery<JobAssignment[]>(orgId, (database) =>
    database
      .select()
      .from(jobAssignments)
      .where(
        and(eq(jobAssignments.jobId, jobId), eq(jobAssignments.orgId, orgId))
      )
      .orderBy(asc(jobAssignments.phase), asc(jobAssignments.createdAt))
  );

  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const people = await db!
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const byId = new Map(people.map((u) => [u.id, u]));

  return rows.map((row) => {
    const u = byId.get(row.userId);
    return {
      ...row,
      userEmail: u?.email ?? "",
      userLabel: u ? displayName(u) : "Unknown user",
    };
  });
}

export async function addJobAssignment(formData: FormData) {
  const session = await requireJobsAccess();
  const jobId = formData.get("jobId") as string;
  const userId = formData.get("userId") as string;
  if (!jobId || !userId) throw new Error("Missing job or user");

  const phase = parsePhase(formData.get("phase"));
  const assignedRole = parseRole(formData.get("assignedRole"));

  await getJobOrThrow(session.user.orgId, jobId);

  const staff = await db!
    .select({ userId: orgMemberships.userId })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, session.user.orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.isStaff, true)
      )
    )
    .limit(1);
  if (!staff[0]) {
    throw new Error("User is not staff — manager-only users cannot be crew");
  }

  const id = randomUUID();
  try {
    await withOrgQueries(session.user.orgId, (database) => [
      database.insert(jobAssignments).values({
        id,
        jobId,
        orgId: session.user.orgId,
        userId,
        phase,
        assignedRole,
      }),
      activityLogInsert(database, {
        orgId: session.user.orgId,
        userId: session.user.id,
        jobId,
        action: `Assigned crew (${phase} / ${assignedRole})`,
        entityType: "job_assignment",
        entityId: id,
        metadata: { assigneeUserId: userId, phase, assignedRole },
      }),
    ]);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("unique") || message.includes("duplicate")) {
      throw new Error("That person is already assigned for this phase");
    }
    throw e;
  }

  await maybePromoteJobToReady({
    orgId: session.user.orgId,
    jobId,
    actorUserId: session.user.id,
  });

  const job = await getJobOrThrow(session.user.orgId, jobId);
  void notifyUser({
    orgId: session.user.orgId,
    orgName: session.user.orgName ?? "Operations",
    orgSlug: session.user.orgSlug,
    userId,
    subject: `Crew assignment · ${job.name}`,
    headline: "You’re on the crew",
    body: `You were assigned to ${job.name} (${phase} · ${assignedRole}).`,
    path: `/dashboard/my-jobs/${jobId}`,
  }).catch((err) => console.error("[email]", err));

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath(`/dashboard/my-jobs/${jobId}`);
  revalidatePath("/dashboard/notifications");
}

export async function removeMyJobAssignment(formData: FormData) {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id || !jobId) throw new Error("Missing assignment");

  const rows = await withOrgQuery<
    (typeof jobAssignments.$inferSelect)[]
  >(session.user.orgId, (database) =>
    database
      .select()
      .from(jobAssignments)
      .where(
        and(
          eq(jobAssignments.id, id),
          eq(jobAssignments.jobId, jobId),
          eq(jobAssignments.orgId, session.user.orgId),
          eq(jobAssignments.userId, session.user.id)
        )
      )
      .limit(1)
  );
  const row = rows[0];
  if (!row) throw new Error("Assignment not found");

  const job = await getJobOrThrow(session.user.orgId, jobId);
  const actorLabel =
    session.user.name?.trim() || session.user.email || "Crew member";

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobAssignments)
      .where(
        and(
          eq(jobAssignments.id, id),
          eq(jobAssignments.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: `${actorLabel} removed themselves from crew (${row.phase} · ${row.assignedRole})`,
      entityType: "job_assignment",
      entityId: id,
      metadata: { reason, phase: row.phase, assignedRole: row.assignedRole },
    }),
  ]);

  void notifyManagers({
    orgId: session.user.orgId,
    orgName: session.user.orgName ?? "Operations",
    orgSlug: session.user.orgSlug,
    subject: `Crew slot open · ${job.name}`,
    headline: "Crew member stepped off a job",
    body: `${actorLabel} removed themselves from ${job.name} (${row.phase} · ${row.assignedRole}).${reason ? `\nReason: ${reason}` : ""}`,
    path: `/dashboard/jobs/${jobId}`,
  }).catch((err) => console.error("[email]", err));

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath(`/dashboard/my-jobs/${jobId}`);
  revalidatePath("/dashboard/notifications");
  redirect(`/dashboard/my-jobs/${jobId}`);
}

export async function deleteJobAssignment(formData: FormData) {
  const session = await requireJobsAccess();
  const id = formData.get("id") as string;
  const jobId = formData.get("jobId") as string;
  if (!id || !jobId) throw new Error("Missing assignment id");

  await getJobOrThrow(session.user.orgId, jobId);

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .delete(jobAssignments)
      .where(
        and(
          eq(jobAssignments.id, id),
          eq(jobAssignments.jobId, jobId),
          eq(jobAssignments.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      jobId,
      action: "Removed crew assignment",
      entityType: "job_assignment",
      entityId: id,
    }),
  ]);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}
