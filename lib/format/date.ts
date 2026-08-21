/** Shared job/date display — always include weekday. */

function asDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Short list/calendar form: `Wed, Aug 20, 2026` */
export function formatJobDate(d: Date | string | null | undefined): string {
  const date = asDate(d);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Date + time for windows: `Wed, Aug 20, 2026, 3:00 PM` */
export function formatJobDateTime(d: Date | string | null | undefined): string {
  const date = asDate(d);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Range for job / load windows. */
export function formatJobDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string {
  if (!start && !end) return "—";
  if (start && end) {
    return `${formatJobDateTime(start)} → ${formatJobDateTime(end)}`;
  }
  return formatJobDateTime(start ?? end);
}
