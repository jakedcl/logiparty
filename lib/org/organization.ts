import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export type Organization = typeof organizations.$inferSelect;

/**
 * The `organizations` table is deliberately NOT granted to the restricted
 * `logiparty_app` role (migration 0009 only grants tenant data tables), so it
 * can never be read or written through withOrgQuery/withOrgQueries. Org rows
 * are read and updated with the plain client instead, like the other org
 * lookups (login, getOrgForSession, billing). Callers must pass an orgId they
 * already checked against the session.
 */
export async function findOrganization(
  orgId: string
): Promise<Organization | undefined> {
  if (!db) throw new Error("DATABASE_URL is not configured");
  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return rows[0];
}

export async function loadOrganization(orgId: string): Promise<Organization> {
  const org = await findOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  return org;
}

export async function updateOrganization(
  orgId: string,
  patch: Partial<typeof organizations.$inferInsert>
): Promise<void> {
  if (!db) throw new Error("DATABASE_URL is not configured");
  await db.update(organizations).set(patch).where(eq(organizations.id, orgId));
}
