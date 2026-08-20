"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import {
  canManageJobs,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  jobAssignments,
  jobs,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

export type NotificationItem = {
  id: string;
  kind: "draft_request" | "assignment";
  title: string;
  detail: string;
  href: string;
  createdAt: Date;
};

const LIMIT = 40;

export async function listNotifications(
  orgId: string
): Promise<NotificationItem[]> {
  const session = await requireSession();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const isManager = canManageJobs(session.user);
  const isStaff = canViewMyJobs(session.user);
  if (!isManager && !isStaff) throw new Error("Forbidden");

  const items: NotificationItem[] = [];

  if (isManager) {
    const drafts = await withOrgQuery<
      {
        id: string;
        name: string;
        createdAt: Date;
        clientName: string | null;
      }[]
    >(orgId, (database) =>
      database
        .select({
          id: jobs.id,
          name: jobs.name,
          createdAt: jobs.createdAt,
          clientName: clientCompanies.name,
        })
        .from(jobs)
        .leftJoin(
          clientCompanies,
          eq(jobs.clientCompanyId, clientCompanies.id)
        )
        .where(and(eq(jobs.orgId, orgId), eq(jobs.status, "draft")))
        .orderBy(desc(jobs.createdAt))
        .limit(LIMIT)
    );

    for (const row of drafts) {
      items.push({
        id: `draft:${row.id}`,
        kind: "draft_request",
        title: "Client job request",
        detail: `${row.name} · ${row.clientName ?? "Client"}`,
        href: `/dashboard/jobs/${row.id}`,
        createdAt: row.createdAt,
      });
    }
  }

  if (isStaff) {
    const assignments = await withOrgQuery<
      {
        id: string;
        jobId: string;
        phase: string;
        assignedRole: string;
        createdAt: Date;
        jobName: string;
        jobStatus: string;
        clientName: string | null;
      }[]
    >(orgId, (database) =>
      database
        .select({
          id: jobAssignments.id,
          jobId: jobAssignments.jobId,
          phase: jobAssignments.phase,
          assignedRole: jobAssignments.assignedRole,
          createdAt: jobAssignments.createdAt,
          jobName: jobs.name,
          jobStatus: jobs.status,
          clientName: clientCompanies.name,
        })
        .from(jobAssignments)
        .innerJoin(jobs, eq(jobAssignments.jobId, jobs.id))
        .leftJoin(
          clientCompanies,
          eq(jobs.clientCompanyId, clientCompanies.id)
        )
        .where(
          and(
            eq(jobAssignments.orgId, orgId),
            eq(jobAssignments.userId, session.user.id),
            inArray(jobs.status, ["upcoming", "ready"])
          )
        )
        .orderBy(desc(jobAssignments.createdAt))
        .limit(LIMIT)
    );

    for (const row of assignments) {
      items.push({
        id: `assign:${row.id}`,
        kind: "assignment",
        title: `Assigned · ${row.phase} ${row.assignedRole}`,
        detail: `${row.jobName} · ${row.clientName ?? "Client"} · ${row.jobStatus}`,
        href: `/dashboard/my-jobs/${row.jobId}`,
        createdAt: row.createdAt,
      });
    }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items.slice(0, LIMIT);
}
