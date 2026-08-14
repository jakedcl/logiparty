import type { BatchItem } from "drizzle-orm/batch";
import type { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";

type Db = NonNullable<typeof db>;

export type ActivityEntry = {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  jobId?: string | null;
  isClientVisible?: boolean;
};

/** Build an activity_logs insert for use inside withOrgQueries. */
export function activityLogInsert(
  database: Db,
  entry: ActivityEntry
): BatchItem<"pg"> {
  return database.insert(activityLogs).values({
    orgId: entry.orgId,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
    jobId: entry.jobId ?? null,
    isClientVisible: entry.isClientVisible ?? false,
  });
}
