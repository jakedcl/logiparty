type JobPanelProps = {
  id?: string;
  title: string;
  count?: number;
  children: React.ReactNode;
};

/** Named section on the job detail page. */
export function JobPanel({ id, title, count, children }: JobPanelProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="lp-job-panel min-w-0 space-y-4">
      <h2 id={id ? `${id}-title` : undefined} className="lp-section-title">
        {title}
        {count != null ? (
          <span className="lp-section-meta">{count}</span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}
