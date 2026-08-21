"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";
import { FALLBACK_PRIMARY_COLOR } from "@/lib/theme/primary-color";
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

  if (!name) throw new Error("Organization name is required");

  // Outbound email "from" display uses organizations.name (see sendInviteEmail).
  // email_from_name column is unused by UI; left in place for backwards safety.
  await db
    .update(organizations)
    .set({
      name,
      logoUrl,
      primaryColor: primaryColor || FALLBACK_PRIMARY_COLOR,
    })
    .where(eq(organizations.id, session.user.orgId));

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
}
