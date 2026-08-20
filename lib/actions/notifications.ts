"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import {
  canManageClientInventory,
  canManageJobs,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  clientInventoryRequests,
  jobAssignments,
  jobs,
} from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export type NotificationItem = {
  id: string;
  kind: "draft_request" | "inventory_request" | "assignment";
  title: string;
  detail: string;
  href: string;
  createdAt: Date;
  /** Set for inventory_request so the inbox can Approve/Deny inline */
  inventoryRequestId?: string;
};

const LIMIT = 40;

function inventoryTypeLabel(type: string): string {
  switch (type) {
    case "add":
      return "Add item";
    case "qty_change":
      return "Qty change";
    case "remove":
      return "Remove";
    default:
      return "Inventory";
  }
}

export async function listNotifications(
  orgId: string
): Promise<NotificationItem[]> {
  const session = await requireSession();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const tags = await getSessionStaffTags(session);
  const isManager = canManageJobs(session.user);
  const canInventory = canManageClientInventory(session.user, tags);
  const isStaff = canViewMyJobs(session.user);
  if (!isManager && !isStaff && !canInventory) throw new Error("Forbidden");

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

  if (canInventory) {
    const invReqs = await withOrgQuery<
      {
        id: string;
        type: string;
        createdAt: Date;
        proposedName: string | null;
        proposedSku: string | null;
        clientName: string | null;
      }[]
    >(orgId, (database) =>
      database
        .select({
          id: clientInventoryRequests.id,
          type: clientInventoryRequests.type,
          createdAt: clientInventoryRequests.createdAt,
          proposedName: clientInventoryRequests.proposedName,
          proposedSku: clientInventoryRequests.proposedSku,
          clientName: clientCompanies.name,
        })
        .from(clientInventoryRequests)
        .leftJoin(
          clientCompanies,
          eq(clientInventoryRequests.clientCompanyId, clientCompanies.id)
        )
        .where(
          and(
            eq(clientInventoryRequests.orgId, orgId),
            eq(clientInventoryRequests.status, "pending")
          )
        )
        .orderBy(desc(clientInventoryRequests.createdAt))
        .limit(LIMIT)
    );

    for (const row of invReqs) {
      const label =
        row.proposedName ?? row.proposedSku ?? inventoryTypeLabel(row.type);
      items.push({
        id: `inv:${row.id}`,
        kind: "inventory_request",
        title: `Inventory · ${inventoryTypeLabel(row.type)}`,
        detail: `${label} · ${row.clientName ?? "Client"}`,
        href: `/dashboard/client-inventory`,
        createdAt: row.createdAt,
        inventoryRequestId: row.id,
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
