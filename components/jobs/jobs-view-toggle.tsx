import { SegmentedControl } from "@/components/marketing/segmented-control";

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
    <SegmentedControl
      ariaLabel="View"
      value={view}
      segments={[
        { id: "list", label: "List", href: basePath },
        { id: "calendar", label: "Calendar", href: calendarHref },
      ]}
    />
  );
}
