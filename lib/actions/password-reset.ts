"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orgMemberships,
  organizations,
  passwordResetTokens,
  users,
} from "@/lib/db/schema";
import {
  buildPasswordResetUrl,
  passwordResetExpiresAt,
} from "@/lib/auth/password-reset-url";
import { passwordResetAllowed, clearLoginAttempts } from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";

const GENERIC_SENT =
  "If an account exists for that email on this workspace, we sent reset instructions.";

/** Always returns ok with a generic message (no account enumeration). */
export async function requestPasswordReset(
  orgSlug: string,
  emailRaw: string
): Promise<{ ok: true; message: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !orgSlug) {
    return { ok: true, message: GENERIC_SENT };
  }

  if (!passwordResetAllowed(orgSlug, email)) {
    return { ok: true, message: GENERIC_SENT };
  }

  if (!db) {
    return { ok: true, message: GENERIC_SENT };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);
  if (!org) {
    return { ok: true, message: GENERIC_SENT };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user?.passwordHash) {
    return { ok: true, message: GENERIC_SENT };
  }

  const [mem] = await db
    .select()
    .from(orgMemberships)
    .where(
      and(eq(orgMemberships.orgId, org.id), eq(orgMemberships.userId, user.id))
    )
    .limit(1);
  if (!mem) {
    return { ok: true, message: GENERIC_SENT };
  }

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.orgId, org.id),
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );

  const token = randomBytes(32).toString("hex");
  const expiresAt = passwordResetExpiresAt();

  await db.insert(passwordResetTokens).values({
    orgId: org.id,
    userId: user.id,
    token,
    expiresAt,
  });

  const resetUrl = buildPasswordResetUrl(token, org.slug);
  await sendPasswordResetEmail({
    to: email,
    orgName: org.name,
    resetUrl,
  });

  return { ok: true, message: GENERIC_SENT };
}

export async function completePasswordReset(formData: FormData) {
  if (!db) throw new Error("Database not configured");

  const token = (formData.get("token") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!token || !password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (password !== confirm) {
    throw new Error("Passwords do not match");
  }

  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      orgId: passwordResetTokens.orgId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      email: users.email,
      orgSlug: organizations.slug,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .innerJoin(organizations, eq(passwordResetTokens.orgId, organizations.id))
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!row || row.usedAt || row.expiresAt <= new Date()) {
    throw new Error("This reset link is invalid or expired");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, row.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  clearLoginAttempts(row.orgSlug, row.email);

  return { email: row.email, orgSlug: row.orgSlug };
}
