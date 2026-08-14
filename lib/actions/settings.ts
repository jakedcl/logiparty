"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";
import { canManageOrgSettings } from "@/lib/auth/permissions";

export async function updateOrgSettings(formData: FormData) {
  const session = await requireSession();
  if (!canManageOrgSettings(session.user)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");

  const name = (formData.get("name") as string)?.trim();
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const primaryColor = (formData.get("primaryColor") as string)?.trim();
  const emailFromName = (formData.get("emailFromName") as string)?.trim() || null;

  if (!name) throw new Error("Organization name is required");

  await db
    .update(organizations)
    .set({
      name,
      logoUrl,
      primaryColor: primaryColor || "#2563eb",
      emailFromName,
    })
    .where(eq(organizations.id, session.user.orgId));

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
}
