import { inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { jobs } from "@/lib/db/schema";

/** Statuses that hold inventory/fleet locks (SCHEMA lock model). */
export const LOCKING_JOB_STATUSES = ["upcoming", "ready"] as const;

/**
 * Conditions for an active lock on a joined `jobs` row:
 * status upcoming/ready AND (load_out_end is null OR load_out_end >= now).
 *
 * Locks release when the job is `completed`/`draft`, or when `load_out_end` is in the past.
 */
export function lockActiveConditions(now: Date = new Date()): SQL[] {
  return [
    inArray(jobs.status, [...LOCKING_JOB_STATUSES]),
    or(isNull(jobs.loadOutEnd), sql`${jobs.loadOutEnd} >= ${now}`)!,
  ];
}
