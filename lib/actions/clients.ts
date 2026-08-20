"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientCompanies, clientUsers, users } from "@/lib/db/schema";
import { canInviteUsers } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export async function listClientCompaniesWithContacts(orgId: string) {
  if (!db) return [];

  const companies = await db
    .select()
    .from(clientCompanies)
    .where(eq(clientCompanies.orgId, orgId))
    .orderBy(asc(clientCompanies.name));

  const contactRows = await db
    .select({
      clientUserId: clientUsers.id,
      clientCompanyId: clientUsers.clientCompanyId,
      title: clientUsers.title,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(clientUsers)
    .innerJoin(users, eq(clientUsers.userId, users.id))
    .where(eq(clientUsers.orgId, orgId))
    .orderBy(asc(users.firstName), asc(users.email));

  const contactsByCompany = new Map<string, typeof contactRows>();
  for (const row of contactRows) {
    const list = contactsByCompany.get(row.clientCompanyId) ?? [];
    list.push(row);
    contactsByCompany.set(row.clientCompanyId, list);
  }

  return companies.map((company) => ({
    company,
    contacts: contactsByCompany.get(company.id) ?? [],
  }));
}

export async function createClientCompany(formData: FormData) {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Company name is required");

  await db.insert(clientCompanies).values({
    orgId: session.user.orgId,
    name,
  });

  revalidatePath("/dashboard/clients");
}
