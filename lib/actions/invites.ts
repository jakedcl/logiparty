"use server";

import { randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  clientUsers,
  invites,
  orgMemberships,
  users,
} from "@/lib/db/schema";
import { buildInviteUrl, sendInviteEmail } from "@/lib/email/send-invite";
import { canInviteUsers } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";
import { getOrgForSession } from "@/lib/org/context";
import bcrypt from "bcryptjs";

export async function createStaffInvite(formData: FormData) {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const isOrgAdmin = formData.get("isOrgAdmin") === "on";
  const isManager = formData.get("isManager") === "on";
  const isStaff = formData.get("isStaff") === "on";

  if (!email) throw new Error("Email is required");
  if (!isOrgAdmin && !isManager && !isStaff) {
    throw new Error("Select at least one role");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(invites).values({
    orgId: session.user.orgId,
    email,
    token,
    isOrgAdmin,
    isManager,
    isStaff,
    isClient: false,
    invitedBy: session.user.id,
    expiresAt,
  });

  const org = await getOrgForSession(session);
  const orgName = org?.name ?? session.user.orgName;
  const inviteUrl = buildInviteUrl(token, session.user.orgSlug);
  await sendInviteEmail({
    to: email,
    orgName,
    inviteUrl,
    // Legacy column only; orgName is the from-display source of truth.
    fromName: org?.emailFromName,
  });

  // Store tags on invite metadata — apply on accept via hidden field
  // For v1, pass tags as comma-separated in invite accept from form on team page
  // Simpler: save tags to sessionStorage — instead add invite_tags table or JSON on invites
  // Quick: add tags column later; for now store in form accept only from re-invite
  // Add optional tags to accept flow via query - skip for minimal: manager sets tags after join on team page

  revalidatePath("/dashboard/team");
}

export async function createClientInvite(formData: FormData) {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const clientCompanyId = formData.get("clientCompanyId") as string;
  if (!email || !clientCompanyId) throw new Error("Email and company required");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(invites).values({
    orgId: session.user.orgId,
    email,
    token,
    isClient: true,
    clientCompanyId,
    invitedBy: session.user.id,
    expiresAt,
  });

  const org = await getOrgForSession(session);
  const orgName = org?.name ?? session.user.orgName;
  const inviteUrl = buildInviteUrl(token, session.user.orgSlug);
  await sendInviteEmail({
    to: email,
    orgName,
    inviteUrl,
    fromName: org?.emailFromName,
  });

  revalidatePath("/dashboard/clients");
}

export async function acceptInvite(formData: FormData) {
  if (!db) throw new Error("Database not configured");

  const token = formData.get("token") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const password = formData.get("password") as string;
  const title = (formData.get("title") as string)?.trim() || null;

  if (!token || !firstName || !lastName || !password) {
    throw new Error("All fields are required");
  }

  const [invite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.token, token),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) throw new Error("Invalid or expired invitation");

  const passwordHash = await bcrypt.hash(password, 10);

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  if (user) {
    await db
      .update(users)
      .set({ passwordHash, firstName, lastName })
      .where(eq(users.id, user.id));
  } else {
    [user] = await db
      .insert(users)
      .values({
        email: invite.email,
        passwordHash,
        firstName,
        lastName,
      })
      .returning();
  }

  const [existing] = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, invite.orgId),
        eq(orgMemberships.userId, user.id)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(orgMemberships)
      .set({
        isOrgAdmin: invite.isOrgAdmin,
        isManager: invite.isManager,
        isStaff: invite.isStaff,
        isClient: invite.isClient,
      })
      .where(eq(orgMemberships.id, existing.id));
  } else {
    await db.insert(orgMemberships).values({
      orgId: invite.orgId,
      userId: user.id,
      isOrgAdmin: invite.isOrgAdmin,
      isManager: invite.isManager,
      isStaff: invite.isStaff,
      isClient: invite.isClient,
    });
  }

  if (invite.isClient && invite.clientCompanyId) {
    await db.insert(clientUsers).values({
      orgId: invite.orgId,
      clientCompanyId: invite.clientCompanyId,
      userId: user.id,
      title: title ?? undefined,
    });
  }

  await db
    .update(invites)
    .set({ acceptedAt: new Date() })
    .where(eq(invites.id, invite.id));

  return { email: invite.email, orgId: invite.orgId };
}
