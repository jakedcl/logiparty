/** Lightweight month-grid helpers for Jobs calendar (local timezone). */

export type CalendarJobInput = {
  id: string;
  name: string;
  status: string;
  clientLabel?: string;
  jobStart: Date | string | null;
  jobEnd: Date | string | null;
};

export type CalendarJobEvent = {
  id: string;
  name: string;
  status: string;
  clientLabel?: string;
  startKey: string;
  endKey: string;
  titleAttr: string;
};

function asDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseYearMonth(
  raw: string | undefined,
  fallback: Date = new Date()
): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [ys, ms] = raw.split("-");
    const year = Number(ys);
    const month = Number(ms);
    if (year >= 1970 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  return { year: fallback.getFullYear(), month: fallback.getMonth() + 1 };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftYearMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Sunday-first month grid (6 weeks × 7). Null = out-of-month padding. */
export function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month - 1, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  return cells;
}

function spanKeys(
  jobStart: Date | string | null,
  jobEnd: Date | string | null
): { startKey: string; endKey: string } | null {
  const start = asDate(jobStart);
  const end = asDate(jobEnd);
  if (!start && !end) return null;
  const a = startOfLocalDay(start ?? end!);
  const b = startOfLocalDay(end ?? start!);
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  return { startKey: toDateKey(lo), endKey: toDateKey(hi) };
}

export function toCalendarEvents(
  jobs: CalendarJobInput[],
  formatDateLabel: (d: Date | string | null) => string
): {
  events: CalendarJobEvent[];
  undated: CalendarJobInput[];
} {
  const events: CalendarJobEvent[] = [];
  const undated: CalendarJobInput[] = [];

  for (const job of jobs) {
    const span = spanKeys(job.jobStart, job.jobEnd);
    if (!span) {
      undated.push(job);
      continue;
    }
    const startLabel = formatDateLabel(job.jobStart ?? job.jobEnd);
    const endLabel =
      job.jobEnd && job.jobStart ? formatDateLabel(job.jobEnd) : null;
    const range =
      endLabel && endLabel !== startLabel
        ? `${startLabel} → ${endLabel}`
        : startLabel;
    const client = job.clientLabel ? ` · ${job.clientLabel}` : "";
    events.push({
      id: job.id,
      name: job.name,
      status: job.status,
      clientLabel: job.clientLabel,
      startKey: span.startKey,
      endKey: span.endKey,
      titleAttr: `${job.name}${client} · ${job.status} · ${range}`,
    });
  }

  return { events, undated };
}

export function eventsByDateKey(
  events: CalendarJobEvent[]
): Map<string, CalendarJobEvent[]> {
  const map = new Map<string, CalendarJobEvent[]>();
  for (const ev of events) {
    let cur = new Date(
      Number(ev.startKey.slice(0, 4)),
      Number(ev.startKey.slice(5, 7)) - 1,
      Number(ev.startKey.slice(8, 10))
    );
    const end = new Date(
      Number(ev.endKey.slice(0, 4)),
      Number(ev.endKey.slice(5, 7)) - 1,
      Number(ev.endKey.slice(8, 10))
    );
    while (cur <= end) {
      const key = toDateKey(cur);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
  }
  return map;
}
