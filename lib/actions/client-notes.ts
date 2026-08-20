"use server";

import { randomUUID } from "crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageJobs } from "@/lib/auth/permissions";
import { db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  clientNotes,
  users,
  type ClientNote,
} from "@/lib/db/schema";
import {
  getSessionClientCompany,
  requireSession,
} from "@/lib/org/context";

export type ClientNoteView = ClientNote & {
  clientName: string | null;
  senderLabel: string;
};

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}

function requireBody(raw: FormDataEntryValue | null): string {
  const body = String(raw ?? "").trim();
  if (!body) throw new Error("Message is required");
  return body;
}

async function requireClientPortalCompany() {
  const session = await requireSession();
  if (!session.user.isClient) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  const company = await getSessionClientCompany(session);
  if (!company) throw new Error("No client company linked");
  return { session, company };
}

async function requireNoteManager() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function enrichNotes(
  orgId: string,
  rows: ClientNote[]
): Promise<ClientNoteView[]> {
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.sentByUserId))];
  const companyIds = [...new Set(rows.map((r) => r.clientCompanyId))];

  const [people, companies] = await Promise.all([
    db!
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, userIds)),
    withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
      database
        .select({ id: clientCompanies.id, name: clientCompanies.name })
        .from(clientCompanies)
        .where(
          and(
            eq(clientCompanies.orgId, orgId),
            inArray(clientCompanies.id, companyIds)
          )
        )
    ),
  ]);

  const byUser = new Map(people.map((u) => [u.id, u]));
  const byCompany = new Map(companies.map((c) => [c.id, c]));

  return rows.map((row) => {
    const u = byUser.get(row.sentByUserId);
    return {
      ...row,
      clientName: byCompany.get(row.clientCompanyId)?.name ?? null,
      senderLabel: u ? displayName(u) : "Unknown user",
    };
  });
}

function revalidateNotePaths() {
  revalidatePath("/portal/notes");
  revalidatePath("/portal");
  revalidatePath("/dashboard/notifications");
}

export async function listPortalClientNotes(
  orgId: string
): Promise<ClientNoteView[]> {
  const { session, company } = await requireClientPortalCompany();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const rows = await withOrgQuery<ClientNote[]>(orgId, (database) =>
    database
      .select()
      .from(clientNotes)
      .where(
        and(
          eq(clientNotes.orgId, orgId),
          eq(clientNotes.clientCompanyId, company.id)
        )
      )
      .orderBy(desc(clientNotes.createdAt))
  );

  return enrichNotes(orgId, rows);
}

export async function listUnreadClientNotes(
  orgId: string
): Promise<ClientNoteView[]> {
  const session = await requireNoteManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const rows = await withOrgQuery<ClientNote[]>(orgId, (database) =>
    database
      .select()
      .from(clientNotes)
      .where(and(eq(clientNotes.orgId, orgId), isNull(clientNotes.readAt)))
      .orderBy(desc(clientNotes.createdAt))
  );

  return enrichNotes(orgId, rows);
}

export async function sendClientNote(formData: FormData) {
  const { session, company } = await requireClientPortalCompany();

  const subject = String(formData.get("subject") ?? "").trim() || null;
  const body = requireBody(formData.get("body"));

  const id = randomUUID();
  await withOrgQueries(session.user.orgId, (database) => [
    database.insert(clientNotes).values({
      id,
      orgId: session.user.orgId,
      clientCompanyId: company.id,
      sentByUserId: session.user.id,
      subject,
      body,
    }),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: subject
        ? `Sent note "${subject}"`
        : "Sent a note to the warehouse team",
      entityType: "client_note",
      entityId: id,
      metadata: {
        clientCompanyId: company.id,
        subject,
      },
      isClientVisible: true,
    }),
  ]);

  revalidateNotePaths();
  redirect("/portal/notes");
}

export async function markClientNoteRead(formData: FormData) {
  const session = await requireNoteManager();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing note id");

  const rows = await withOrgQuery<ClientNote[]>(session.user.orgId, (database) =>
    database
      .select()
      .from(clientNotes)
      .where(
        and(eq(clientNotes.id, id), eq(clientNotes.orgId, session.user.orgId))
      )
      .limit(1)
  );
  const existing = rows[0];
  if (!existing) throw new Error("Note not found");
  if (existing.readAt) {
    revalidateNotePaths();
    return;
  }

  const now = new Date();
  await withOrgQueries(session.user.orgId, (database) => [
    database
      .update(clientNotes)
      .set({
        readAt: now,
        readByUserId: session.user.id,
      })
      .where(
        and(
          eq(clientNotes.id, id),
          eq(clientNotes.orgId, session.user.orgId),
          isNull(clientNotes.readAt)
        )
      ),
    activityLogInsert(database, {
      orgId: session.user.orgId,
      userId: session.user.id,
      action: "Marked client note as read",
      entityType: "client_note",
      entityId: id,
      metadata: {
        clientCompanyId: existing.clientCompanyId,
        subject: existing.subject,
      },
      isClientVisible: false,
    }),
  ]);

  revalidateNotePaths();
}
