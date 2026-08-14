"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canManageTools } from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import { tools, type Tool } from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

async function requireToolsAccess() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageTools(session.user, tags)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

function parseQuantity(raw: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("Quantity must be a positive integer");
  }
  return n;
}

export async function createTool(formData: FormData) {
  const session = await requireToolsAccess();

  const name = (formData.get("name") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!name) throw new Error("Name is required");

  await withOrgQuery(session.user.orgId, (database) =>
    database.insert(tools).values({
      orgId: session.user.orgId,
      sku,
      name,
      totalQuantity,
    })
  );

  revalidatePath("/dashboard/tools");
}

export async function updateTool(formData: FormData) {
  const session = await requireToolsAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing tool id");

  const name = (formData.get("name") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!name) throw new Error("Name is required");

  await withOrgQuery(session.user.orgId, (database) =>
    database
      .update(tools)
      .set({ name, sku, totalQuantity })
      .where(and(eq(tools.id, id), eq(tools.orgId, session.user.orgId)))
  );

  revalidatePath("/dashboard/tools");
}

export async function deleteTool(formData: FormData) {
  const session = await requireToolsAccess();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing tool id");

  await withOrgQuery(session.user.orgId, (database) =>
    database
      .delete(tools)
      .where(and(eq(tools.id, id), eq(tools.orgId, session.user.orgId)))
  );

  revalidatePath("/dashboard/tools");
}

export async function listTools(orgId: string): Promise<Tool[]> {
  const session = await requireToolsAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<Tool[]>(orgId, (database) =>
    database
      .select()
      .from(tools)
      .where(eq(tools.orgId, orgId))
      .orderBy(asc(tools.name))
  );
}
