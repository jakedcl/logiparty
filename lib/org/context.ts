import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { db } from "@/lib/db";
import {
  orgMemberships,
  organizations,
  staffCapabilityTags,
  clientCompanies,
  clientUsers,
} from "@/lib/db/schema";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getOrgForSession(session: Session) {
  if (!db) throw new Error("DATABASE_URL is not configured");
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.user.orgId))
    .limit(1);
  return org ?? null;
}

/** Staff capability tags for the signed-in user's membership in this org */
export async function getSessionStaffTags(
  session: Session
): Promise<string[]> {
  if (!db) return [];
  const [mem] = await db
    .select({ id: orgMemberships.id })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, session.user.orgId),
        eq(orgMemberships.userId, session.user.id)
      )
    )
    .limit(1);
  if (!mem) return [];

  const rows = await db
    .select({ tag: staffCapabilityTags.tag })
    .from(staffCapabilityTags)
    .where(eq(staffCapabilityTags.membershipId, mem.id));
  return rows.map((r) => r.tag);
}

/** Client company linked to this user (portal scope). Null for staff. */
export async function getSessionClientCompany(session: Session) {
  if (!db || !session.user.isClient) return null;
  const [row] = await db
    .select({
      company: clientCompanies,
    })
    .from(clientUsers)
    .innerJoin(
      clientCompanies,
      eq(clientUsers.clientCompanyId, clientCompanies.id)
    )
    .where(
      and(
        eq(clientUsers.orgId, session.user.orgId),
        eq(clientUsers.userId, session.user.id)
      )
    )
    .limit(1);
  return row?.company ?? null;
}
