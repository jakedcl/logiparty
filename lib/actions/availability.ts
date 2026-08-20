"use server";

import { randomUUID } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { activityLogInsert } from "@/lib/activity/log";
import {
  canReviewAvailability,
  canSubmitAvailability,
} from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  availabilityRequests,
  users,
  type AvailabilityRequest,
  type AvailabilityStatus,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

function parseDateTime(raw: FormDataEntryValue | null, label: string): Date {
  const value = String(raw ?? "").trim();
  if (!value) throw new Error(`${label} is required`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label.toLowerCase()}`);
  return d;
}

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

export type AvailabilityRequestView = AvailabilityRequest & {
  userLabel: string;
};

async function enrichWithLabels(
  orgId: string,
  rows: AvailabilityRequest[]
): Promise<AvailabilityRequestView[]> {
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
      userLabel: u ? displayName(u) : "Unknown user",
    };
  });
}

export async function listMyAvailabilityRequests(
  orgId: string
): Promise<AvailabilityRequest[]> {
  const session = await requireSession();
  if (!canSubmitAvailability(session.user)) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  return withOrgQuery<AvailabilityRequest[]>(orgId, (database) =>
    database
      .select()
      .from(availabilityRequests)
      .where(
        and(
          eq(availabilityRequests.orgId, orgId),
          eq(availabilityRequests.userId, session.user.id)
        )
      )
      .orderBy(desc(availabilityRequests.startTime))
  );
}

export async function listPendingAvailabilityRequests(
  orgId: string
): Promise<AvailabilityRequestView[]> {
  const session = await requireSession();
  if (!canReviewAvailability(session.user)) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const rows = await withOrgQuery<AvailabilityRequest[]>(orgId, (database) =>
    database
      .select()
      .from(availabilityRequests)
      .where(
        and(
          eq(availabilityRequests.orgId, orgId),
          eq(availabilityRequests.status, "Pending")
        )
      )
      .orderBy(availabilityRequests.startTime)
  );

  return enrichWithLabels(orgId, rows);
}

export async function submitAvailabilityRequest(formData: FormData) {
  const session = await requireSession();
  if (!canSubmitAvailability(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const startTime = parseDateTime(formData.get("startTime"), "Start time");
  const endTime = parseDateTime(formData.get("endTime"), "End time");
  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  const reason = (formData.get("reason") as string)?.trim() || null;
  const id = randomUUID();

  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(availabilityRequests).values({
      id,
      orgId: session.user.orgId,
      userId: session.user.id,
      startTime,
      endTime,
      reason,
      status: "Pending",
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Submitted availability request",
      entityType: "availability_request",
      entityId: id,
      metadata: { startTime: startTime.toISOString(), endTime: endTime.toISOString() },
    }),
  ]);

  revalidatePath("/dashboard/settings/time-off");
  revalidatePath("/dashboard/settings");
}

function parseReviewStatus(raw: FormDataEntryValue | null): AvailabilityStatus {
  const value = String(raw ?? "");
  if (value !== "Approved" && value !== "Denied") {
    throw new Error("Invalid review action");
  }
  return value;
}

export async function reviewAvailabilityRequest(formData: FormData) {
  const session = await requireSession();
  if (!canReviewAvailability(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing request id");
  const status = parseReviewStatus(formData.get("status"));

  const rows = await withOrgQuery<AvailabilityRequest[]>(
    session.user.orgId,
    (database) =>
      database
        .select()
        .from(availabilityRequests)
        .where(
          and(
            eq(availabilityRequests.id, id),
            eq(availabilityRequests.orgId, session.user.orgId)
          )
        )
        .limit(1)
  );
  const existing = rows[0];
  if (!existing) throw new Error("Request not found");
  if (existing.status !== "Pending") {
    throw new Error("Request was already reviewed");
  }

  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(availabilityRequests)
      .set({ status, reviewedBy: session.user.id })
      .where(
        and(
          eq(availabilityRequests.id, id),
          eq(availabilityRequests.orgId, session.user.orgId)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: `${status} availability request`,
      entityType: "availability_request",
      entityId: id,
      metadata: { status, forUserId: existing.userId },
    }),
  ]);

  revalidatePath("/dashboard/settings/time-off");
  revalidatePath("/dashboard/settings");
}
