"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  orgMemberships,
  staffCapabilityTags,
  STAFF_TAGS,
  users,
} from "@/lib/db/schema";
import { canInviteUsers } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export async function updateMembershipRoles(formData: FormData) {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const membershipId = formData.get("membershipId") as string;
  if (!membershipId) throw new Error("Missing membership");

  await db
    .update(orgMemberships)
    .set({
      isOrgAdmin: formData.get("isOrgAdmin") === "on",
      isManager: formData.get("isManager") === "on",
      isStaff: formData.get("isStaff") === "on",
    })
    .where(
      and(
        eq(orgMemberships.id, membershipId),
        eq(orgMemberships.orgId, session.user.orgId)
      )
    );

  revalidatePath("/dashboard/team");
}

export async function updateStaffTags(formData: FormData) {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const membershipId = formData.get("membershipId") as string;
  if (!membershipId) throw new Error("Missing membership");

  const [membership] = await db
    .select({ id: orgMemberships.id })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.id, membershipId),
        eq(orgMemberships.orgId, session.user.orgId)
      )
    )
    .limit(1);
  if (!membership) throw new Error("Forbidden");

  const selected = STAFF_TAGS.filter(
    (tag) => formData.get(`tag-${tag}`) === "on"
  );

  const deleteTags = db
    .delete(staffCapabilityTags)
    .where(eq(staffCapabilityTags.membershipId, membership.id));

  if (selected.length > 0) {
    await db.batch([
      deleteTags,
      db.insert(staffCapabilityTags).values(
        selected.map((tag) => ({ membershipId: membership.id, tag }))
      ),
    ]);
  } else {
    await deleteTags;
  }

  revalidatePath("/dashboard/team");
}

export async function listTeamMembers(orgId: string) {
  const session = await requireSession();
  if (!canInviteUsers(session.user) || session.user.orgId !== orgId) {
    throw new Error("Forbidden");
  }
  if (!db) return [];
  const rows = await db
    .select({
      membership: orgMemberships,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(orgMemberships)
    .innerJoin(users, eq(orgMemberships.userId, users.id))
    .where(eq(orgMemberships.orgId, orgId));

  const tags = await db
    .select({
      membershipId: staffCapabilityTags.membershipId,
      tag: staffCapabilityTags.tag,
    })
    .from(staffCapabilityTags)
    .innerJoin(
      orgMemberships,
      eq(staffCapabilityTags.membershipId, orgMemberships.id)
    )
    .where(eq(orgMemberships.orgId, session.user.orgId));
  const tagsByMembership = new Map<string, string[]>();
  for (const t of tags) {
    const list = tagsByMembership.get(t.membershipId) ?? [];
    list.push(t.tag);
    tagsByMembership.set(t.membershipId, list);
  }

  return rows.map((r) => ({
    ...r,
    tags: tagsByMembership.get(r.membership.id) ?? [],
  }));
}
