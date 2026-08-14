"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageClientInventory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { clientCompanies, clientInventoryItems } from "@/lib/db/schema";
import { getSessionClientCompany, getSessionStaffTags, requireSession } from "@/lib/org/context";

async function requireClientInventoryAccess() {
  const session = await requireSession();
  const tags = await getSessionStaffTags(session);
  if (!canManageClientInventory(session.user, tags)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");
  return session;
}

function parseQuantity(raw: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Quantity must be a non-negative integer");
  }
  return n;
}

async function assertCompanyInOrg(orgId: string, clientCompanyId: string) {
  const [company] = await db!
    .select({ id: clientCompanies.id })
    .from(clientCompanies)
    .where(
      and(
        eq(clientCompanies.id, clientCompanyId),
        eq(clientCompanies.orgId, orgId)
      )
    )
    .limit(1);
  if (!company) throw new Error("Client company not found");
}

export async function createClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const clientCompanyId = formData.get("clientCompanyId") as string;
  const sku = (formData.get("sku") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!clientCompanyId) throw new Error("Client company is required");
  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  await assertCompanyInOrg(session.user.orgId, clientCompanyId);

  await db!.insert(clientInventoryItems).values({
    orgId: session.user.orgId,
    clientCompanyId,
    sku,
    name,
    description,
    totalQuantity,
  });

  revalidatePath("/dashboard/client-inventory");
  revalidatePath("/portal");
  redirect(`/dashboard/client-inventory?companyId=${clientCompanyId}`);
}

export async function updateClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const id = formData.get("id") as string;
  const clientCompanyId = formData.get("clientCompanyId") as string;
  if (!id) throw new Error("Missing item id");

  const sku = (formData.get("sku") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const totalQuantity = parseQuantity(formData.get("totalQuantity"));

  if (!sku) throw new Error("SKU is required");
  if (!name) throw new Error("Name is required");

  await db!
    .update(clientInventoryItems)
    .set({ sku, name, description, totalQuantity })
    .where(
      and(
        eq(clientInventoryItems.id, id),
        eq(clientInventoryItems.orgId, session.user.orgId)
      )
    );

  revalidatePath("/dashboard/client-inventory");
  revalidatePath("/portal");
  if (clientCompanyId) {
    redirect(`/dashboard/client-inventory?companyId=${clientCompanyId}`);
  }
}

export async function deleteClientInventoryItem(formData: FormData) {
  const session = await requireClientInventoryAccess();

  const id = formData.get("id") as string;
  const clientCompanyId = formData.get("clientCompanyId") as string;
  if (!id) throw new Error("Missing item id");

  await db!
    .delete(clientInventoryItems)
    .where(
      and(
        eq(clientInventoryItems.id, id),
        eq(clientInventoryItems.orgId, session.user.orgId)
      )
    );

  revalidatePath("/dashboard/client-inventory");
  revalidatePath("/portal");
  if (clientCompanyId) {
    redirect(`/dashboard/client-inventory?companyId=${clientCompanyId}`);
  }
}

export async function listClientCompaniesForOrg(orgId: string) {
  const session = await requireClientInventoryAccess();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return db!
    .select()
    .from(clientCompanies)
    .where(eq(clientCompanies.orgId, orgId))
    .orderBy(asc(clientCompanies.name));
}

export async function listClientInventoryItems(
  orgId: string,
  clientCompanyId?: string
) {
  const session = await requireSession();
  if (!db) return [];
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  let companyId = clientCompanyId;
  if (session.user.isClient) {
    const company = await getSessionClientCompany(session);
    if (!company) return [];
    companyId = company.id;
  } else {
    const tags = await getSessionStaffTags(session);
    if (!canManageClientInventory(session.user, tags)) {
      throw new Error("Forbidden");
    }
  }

  const filters = [eq(clientInventoryItems.orgId, orgId)];
  if (companyId) {
    filters.push(eq(clientInventoryItems.clientCompanyId, companyId));
  }
  return db
    .select()
    .from(clientInventoryItems)
    .where(and(...filters))
    .orderBy(asc(clientInventoryItems.name));
}
