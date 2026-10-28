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

/** Tailwind / token classes for report bar fills (matches status badge hues). */
export function jobStatusBarClass(status: string): string {
  const key = status.toLowerCase();
  switch (key) {
    case "draft":
      return "bg-gradient-to-b from-[#fff6c8] to-[#f0d56a]";
    case "upcoming":
      return "bg-gradient-to-b from-white to-[color-mix(in_srgb,var(--info)_18%,white)] border border-[color-mix(in_srgb,var(--info)_45%,white)]";
    case "ready":
      return "bg-gradient-to-b from-white to-[color-mix(in_srgb,var(--success)_16%,white)] border border-[color-mix(in_srgb,var(--success)_40%,white)]";
    case "completed":
      return "bg-gradient-to-b from-[#f7f7f7] to-[#e4e4e4] border border-[var(--lp-line-strong)]";
    case "denied":
      return "bg-gradient-to-b from-white to-[color-mix(in_srgb,var(--danger)_14%,white)] border border-[color-mix(in_srgb,var(--danger)_40%,white)]";
    default:
      return "bg-[var(--primary)]";
  }
}
