"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  activityLogs,
  jobs,
  users,
  type ActivityLog,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

export type ActivityLogView = ActivityLog & {
  actorLabel: string;
  jobName: string | null;
};

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

export async function listActivityLogs(
  orgId: string,
  limit = 100
): Promise<ActivityLogView[]> {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) return [];

  const rows = await withOrgQuery<ActivityLog[]>(orgId, (database) =>
    database
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.orgId, orgId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(Math.min(limit, 200))
  );

  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const jobIds = [
    ...new Set(rows.map((r) => r.jobId).filter((id): id is string => Boolean(id))),
  ];

  const [people, jobRows] = await Promise.all([
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, userIds)),
    jobIds.length > 0
      ? withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
          database
            .select({ id: jobs.id, name: jobs.name })
            .from(jobs)
            .where(inArray(jobs.id, jobIds))
        )
      : Promise.resolve([]),
  ]);

  const peopleById = new Map(people.map((u) => [u.id, u]));
  const jobsById = new Map(jobRows.map((j) => [j.id, j.name]));

  return rows.map((row) => {
    const actor = peopleById.get(row.userId);
    return {
      ...row,
      actorLabel: actor ? displayName(actor) : "Unknown user",
      jobName: row.jobId ? (jobsById.get(row.jobId) ?? null) : null,
    };
  });
}
