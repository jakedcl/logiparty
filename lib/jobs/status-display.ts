import type { JobStatus } from "@/lib/db/schema";

/** Canonical job status ordering for charts and filters. */
export const JOB_STATUS_ORDER: JobStatus[] = [
  "draft",
  "upcoming",
  "ready",
  "completed",
  "denied",
];

const LABELS: Record<string, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  ready: "Ready",
  completed: "Completed",
  denied: "Denied",
};

export function jobStatusLabel(status: string): string {
  return LABELS[status.toLowerCase()] ?? status;
}

export function sortJobStatusCounts<T extends { status: string }>(
  rows: T[]
): T[] {
  const rank = new Map(JOB_STATUS_ORDER.map((s, i) => [s, i]));
  return [...rows].sort(
    (a, b) => (rank.get(a.status as JobStatus) ?? 99) - (rank.get(b.status as JobStatus) ?? 99)
  );
}

/** Solid fills for report bars (readable at a glance on a neutral track). */
export function jobStatusBarClass(status: string): string {
  const key = status.toLowerCase();
  switch (key) {
    case "draft":
      return "bg-[#c9a227]";
    case "upcoming":
      return "bg-[#2563eb]";
    case "ready":
      return "bg-[#16a34a]";
    case "completed":
      return "bg-[#475569]";
    case "denied":
      return "bg-[#dc2626]";
    default:
      return "bg-[var(--primary)]";
  }
}
