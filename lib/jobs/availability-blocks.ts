import { and, eq, gt, lt } from "drizzle-orm";
import { withOrgQuery } from "@/lib/db";
import { availabilityRequests } from "@/lib/db/schema";

/** User IDs with approved time-off overlapping [windowStart, windowEnd). */
export async function getUsersWithApprovedTimeOff(args: {
  orgId: string;
  windowStart: Date;
  windowEnd: Date;
}): Promise<Set<string>> {
  const { orgId, windowStart, windowEnd } = args;

  const rows = await withOrgQuery<{ userId: string }[]>(orgId, (database) =>
    database
      .select({ userId: availabilityRequests.userId })
      .from(availabilityRequests)
      .where(
        and(
          eq(availabilityRequests.orgId, orgId),
          eq(availabilityRequests.status, "Approved"),
          lt(availabilityRequests.startTime, windowEnd),
          gt(availabilityRequests.endTime, windowStart)
        )
      )
  );

  return new Set(rows.map((r) => r.userId));
}

export function jobAssignmentWindow(job: {
  jobStart: Date | null;
  jobEnd: Date | null;
  loadInStart: Date | null;
  loadOutEnd: Date | null;
}): { start: Date; end: Date } | null {
  const start = job.loadInStart ?? job.jobStart;
  const end = job.loadOutEnd ?? job.jobEnd;
  if (!start || !end) return null;
  return { start, end };
}
