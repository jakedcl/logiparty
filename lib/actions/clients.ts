"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clientCompanies } from "@/lib/db/schema";
import { canInviteUsers } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

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
