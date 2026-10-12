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
    <div className="lp-tabs" role="group" aria-label="View">
      <Link
        href={basePath}
        className={cn("lp-tab", view === "list" && "lp-tab-active")}
        aria-current={view === "list" ? "page" : undefined}
      >
        List
      </Link>
      <Link
        href={calendarHref}
        className={cn("lp-tab", view === "calendar" && "lp-tab-active")}
        aria-current={view === "calendar" ? "page" : undefined}
      >
        Calendar
      </Link>
    </div>
  );
}
