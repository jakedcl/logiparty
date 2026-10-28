import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientUsers, orgMemberships, users } from "@/lib/db/schema";
import { sendOrgEmail } from "@/lib/email/send-org-email";

export function tenantAbsoluteUrl(orgSlug: string, path: string): string {
  const root =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().replace(/^www\./, "") ??
    "logiparty.com";
  const isDev = process.env.NODE_ENV === "development";
  const base = isDev
    ? `http://${orgSlug}.localhost:3000`
    : `https://${orgSlug}.${root}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function listManagerEmails(orgId: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db
    .select({ email: users.email, notifyEmail: orgMemberships.notifyEmail })
    .from(orgMemberships)
    .innerJoin(users, eq(orgMemberships.userId, users.id))
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        or(
          eq(orgMemberships.isManager, true),
          eq(orgMemberships.isOrgAdmin, true)
        )
      )
    );
  return rows
    .filter((r) => r.notifyEmail !== false)
    .map((r) => r.email)
    .filter(Boolean);
}

export async function getUserEmailIfNotified(
  orgId: string,
  userId: string
): Promise<string | null> {
  if (!db) return null;
  const [row] = await db
    .select({ email: users.email, notifyEmail: orgMemberships.notifyEmail })
    .from(orgMemberships)
    .innerJoin(users, eq(orgMemberships.userId, users.id))
    .where(
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.userId, userId))
    )
    .limit(1);
  if (!row || row.notifyEmail === false) return null;
  return row.email;
}

export async function listClientUserEmails(
  orgId: string,
  clientCompanyId: string
): Promise<string[]> {
  if (!db) return [];
  const rows = await db
    .select({ email: users.email, notifyEmail: orgMemberships.notifyEmail })
    .from(clientUsers)
    .innerJoin(users, eq(clientUsers.userId, users.id))
    .innerJoin(
      orgMemberships,
      and(
        eq(orgMemberships.userId, users.id),
        eq(orgMemberships.orgId, orgId)
      )
    )
    .where(eq(clientUsers.clientCompanyId, clientCompanyId));
  return rows
    .filter((r) => r.notifyEmail !== false)
    .map((r) => r.email);
}

export async function notifyClientCompanyUsers(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  clientCompanyId: string;
  subject: string;
  headline: string;
  body: string;
  path: string;
}) {
  const emails = await listClientUserEmails(
    params.orgId,
    params.clientCompanyId
  );
  if (emails.length === 0) return;
  await sendOrgEmail({
    to: emails,
    orgName: params.orgName,
    subject: params.subject,
    headline: params.headline,
    body: params.body,
    actionLabel: "View in portal",
    actionUrl: tenantAbsoluteUrl(params.orgSlug, params.path),
  });
}

export async function notifyManagers(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  subject: string;
  headline: string;
  body: string;
  path: string;
}) {
  const emails = await listManagerEmails(params.orgId);
  if (emails.length === 0) return;
  await sendOrgEmail({
    to: emails,
    orgName: params.orgName,
    subject: params.subject,
    headline: params.headline,
    body: params.body,
    actionLabel: "Open in dashboard",
    actionUrl: tenantAbsoluteUrl(params.orgSlug, params.path),
  });
}

export async function notifyUser(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  userId: string;
  subject: string;
  headline: string;
  body: string;
  path: string;
}) {
  const email = await getUserEmailIfNotified(params.orgId, params.userId);
  if (!email) return;
  await sendOrgEmail({
    to: email,
    orgName: params.orgName,
    subject: params.subject,
    headline: params.headline,
    body: params.body,
    actionLabel: "View",
    actionUrl: tenantAbsoluteUrl(params.orgSlug, params.path),
  });
}
