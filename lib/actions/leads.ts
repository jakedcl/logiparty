"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { marketingLeads } from "@/lib/db/schema";
import { sendLeadNotification } from "@/lib/email/send-lead-notification";

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().max(2000).optional(),
});

/** Simple per-email throttle for public lead form. */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const buckets = new Map<string, { count: number; resetAt: number }>();

function leadAllowed(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_PER_WINDOW) return false;
  existing.count += 1;
  return true;
}

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitMarketingLead(
  input: z.infer<typeof leadSchema>
): Promise<SubmitLeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const data = parsed.data;
  if (!leadAllowed(data.email)) {
    return {
      ok: false,
      error: "Too many requests from this email. Try again later.",
    };
  }

  try {
    if (db) {
      await db.insert(marketingLeads).values({
        name: data.name,
        email: data.email.toLowerCase(),
        company: data.company || null,
        message: data.message || null,
      });
    } else {
      console.log("\n[dev] Marketing lead (no DATABASE_URL):\n", data, "\n");
    }

    await sendLeadNotification({
      name: data.name,
      email: data.email,
      company: data.company,
      message: data.message,
    });

    return { ok: true };
  } catch (err) {
    console.error("[leads] submit failed:", err);
    return {
      ok: false,
      error: "Something went wrong. Email hello@logiparty.com instead.",
    };
  }
}
