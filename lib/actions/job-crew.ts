"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageJobs } from "@/lib/auth/permissions";
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
export async function listCrewCandidates(orgId: string): Promise<CrewCandidate[]> {
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
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.isStaff, true))
    )
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.email));

  return rows.map((r) => ({
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
  const session = await requireJobsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  await getJobOrThrow(orgId, jobId);

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

  revalidatePath(`/dashboard/jobs/${jobId}`);
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
