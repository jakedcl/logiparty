type JobPanelProps = {
  title: string;
  count?: number;
  children: React.ReactNode;
};

/** Named section on the job detail page (no card chrome). */
export function JobPanel({ title, count, children }: JobPanelProps) {
  return (
    <section className="min-w-0 space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
        {title}
        {count != null && count > 0 ? (
          <span className="ml-1.5 font-normal text-neutral-400">{count}</span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}
