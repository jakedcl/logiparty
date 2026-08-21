import Link from "next/link";
import { cn } from "@/lib/utils";

type View = "list" | "calendar";

type Props = {
  basePath: string;
  view: View;
  /** Preserve month when switching back to calendar */
  month?: string;
};

export function JobsViewToggle({ basePath, view, month }: Props) {
  const calendarHref =
    month && /^\d{4}-\d{2}$/.test(month)
      ? `${basePath}?view=calendar&month=${month}`
      : `${basePath}?view=calendar`;

  return (
    <div
      className="inline-flex rounded-md border border-border bg-white p-0.5 text-sm"
      role="group"
      aria-label="View"
    >
      <Link
        href={basePath}
        className={cn(
          "rounded px-2.5 py-1 font-medium transition-colors",
          view === "list"
            ? "bg-neutral-900 text-white"
            : "text-neutral-600 hover:text-neutral-900"
        )}
        aria-current={view === "list" ? "page" : undefined}
      >
        List
      </Link>
      <Link
        href={calendarHref}
        className={cn(
          "rounded px-2.5 py-1 font-medium transition-colors",
          view === "calendar"
            ? "bg-neutral-900 text-white"
            : "text-neutral-600 hover:text-neutral-900"
        )}
        aria-current={view === "calendar" ? "page" : undefined}
      >
        Calendar
      </Link>
    </div>
  );
}
