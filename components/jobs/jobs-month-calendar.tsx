import Link from "next/link";
import { formatJobDate } from "@/lib/format/date";
import {
  buildMonthGrid,
  eventsByDateKey,
  formatYearMonth,
  shiftYearMonth,
  toCalendarEvents,
  toDateKey,
  type CalendarJobInput,
} from "@/lib/jobs/calendar";
import { statusBadgeClass } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MAX_VISIBLE = 3;

type Props = {
  jobs: CalendarJobInput[];
  /** e.g. `/dashboard/jobs` or `/dashboard/my-jobs` */
  hrefBase: string;
  year: number;
  month: number;
};

export function JobsMonthCalendar({ jobs, hrefBase, year, month }: Props) {
  const { events, undated } = toCalendarEvents(jobs, formatJobDate);
  const byDay = eventsByDateKey(events);
  const cells = buildMonthGrid(year, month);
  const prev = shiftYearMonth(year, month, -1);
  const next = shiftYearMonth(year, month, 1);
  const todayKey = toDateKey(new Date());

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const hrefForMonth = (y: number, m: number) =>
    `${hrefBase}?view=calendar&month=${formatYearMonth(y, m)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={hrefForMonth(prev.year, prev.month)}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Prev
        </Link>
        <h3 className="text-sm font-semibold text-neutral-900 tabular-nums">
          {monthLabel}
        </h3>
        <Link
          href={hrefForMonth(next.year, next.month)}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Next →
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[36rem]">
          <div className="grid grid-cols-7 gap-px border border-border bg-border rounded-md overflow-hidden">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-neutral-50 px-1.5 py-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-500"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              if (!cell) {
                return (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[4.5rem] sm:min-h-[5.5rem] bg-neutral-50/80"
                  />
                );
              }
              const key = toDateKey(cell);
              const dayEvents = byDay.get(key) ?? [];
              const visible = dayEvents.slice(0, MAX_VISIBLE);
              const overflow = dayEvents.length - visible.length;
              const isToday = key === todayKey;

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[4.5rem] sm:min-h-[5.5rem] bg-white p-1 flex flex-col gap-0.5",
                    isToday &&
                      "ring-1 ring-inset ring-[color-mix(in_srgb,var(--primary)_45%,transparent)]"
                  )}
                >
                  <div
                    className={cn(
                      "text-[0.7rem] font-medium tabular-nums px-0.5",
                      isToday ? "text-[var(--primary)]" : "text-neutral-500"
                    )}
                  >
                    <span className="sm:hidden">
                      {WEEKDAYS[cell.getDay()]} {cell.getDate()}
                    </span>
                    <span className="hidden sm:inline">{cell.getDate()}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {visible.map((ev) => (
                      <Link
                        key={`${ev.id}-${key}`}
                        href={`${hrefBase}/${ev.id}`}
                        title={ev.titleAttr}
                        className={cn(
                          "lp-status block truncate text-[0.625rem] leading-tight px-1 py-0.5 hover:opacity-90",
                          statusBadgeClass(ev.status, "job")
                        )}
                      >
                        {ev.name}
                      </Link>
                    ))}
                    {overflow > 0 ? (
                      <span
                        className="px-0.5 text-[0.625rem] text-neutral-400"
                        title={dayEvents
                          .slice(MAX_VISIBLE)
                          .map((e) => e.name)
                          .join(", ")}
                      >
                        +{overflow} more
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {undated.length > 0 ? (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-sm text-neutral-600">
            No start date
            <span className="ml-1 text-neutral-400">({undated.length})</span>
          </p>
          <ul className="space-y-1">
            {undated.map((job) => (
              <li key={job.id} className="text-sm">
                <Link
                  href={`${hrefBase}/${job.id}`}
                  className="font-medium text-neutral-900 hover:underline underline-offset-2"
                >
                  {job.name}
                </Link>
                {job.clientLabel ? (
                  <span className="ml-2 text-neutral-500">{job.clientLabel}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
