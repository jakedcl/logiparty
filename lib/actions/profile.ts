"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_update } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function loadOwnUser(userId: string) {
  if (!db) throw new Error("Database not configured");
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function getOwnProfile() {
  const session = await requireSession();
  const user = await loadOwnUser(session.user.id);
  if (!user) throw new Error("User not found");
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    hasPassword: Boolean(user.passwordHash),
  };
}

export async function updateProfileName(
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await requireSession();
  if (!db) return { ok: false, error: "Database not configured" };

  const firstName = (formData.get("firstName") as string)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string)?.trim() ?? "";

  if (!firstName && !lastName) {
    return { ok: false, error: "Enter a first or last name." };
  }

  await db
    .update(users)
    .set({ firstName: firstName || null, lastName: lastName || null })
    .where(eq(users.id, session.user.id));

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || session.user.email || "";

  await unstable_update({ user: { name: displayName } });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/portal", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/profile");
  revalidatePath("/dashboard/profile");
  revalidatePath("/portal/profile");
  return { ok: true };
}

export async function changeOwnPassword(
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await requireSession();
  if (!db) return { ok: false, error: "Database not configured" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: "Fill in all password fields." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords do not match." };
  }

  const user = await loadOwnUser(session.user.id);
  if (!user?.passwordHash) {
    return { ok: false, error: "Password change is not available for this account." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, session.user.id));

  return { ok: true };
}
