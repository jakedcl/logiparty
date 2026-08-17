import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, withOrgQuery } from "@/lib/db";
import { jobs, organizations } from "@/lib/db/schema";
import { maybePromoteJobToReady } from "@/lib/jobs/auto-ready";

/**
 * Optional batch auto-ready. Protect with CRON_SECRET header when set.
 * Authorization: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const orgs = await db.select({ id: organizations.id }).from(organizations);
  let promoted = 0;

  for (const org of orgs) {
    const upcoming = await withOrgQuery<{ id: string; createdBy: string | null }[]>(
      org.id,
      (database) =>
        database
          .select({ id: jobs.id, createdBy: jobs.createdBy })
          .from(jobs)
          .where(and(eq(jobs.orgId, org.id), eq(jobs.status, "upcoming")))
    );

    for (const job of upcoming) {
      if (!job.createdBy) continue;
      const ok = await maybePromoteJobToReady({
        orgId: org.id,
        jobId: job.id,
        actorUserId: job.createdBy,
      });
      if (ok) promoted += 1;
    }
  }

  return NextResponse.json({ ok: true, promoted });
}
