import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/** Consistent page title block — tight heading, quiet lede, optional CTA. */
export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="lp-page-title">{title}</h1>
        {description ? (
          <div className="lp-page-sub max-w-2xl">{description}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
