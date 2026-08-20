type JobPanelProps = {
  description?: string;
  children: React.ReactNode;
};

/** Active tab body — no card chrome; tab nav already names the section. */
export function JobPanel({ description, children }: JobPanelProps) {
  return (
    <section className="job-panel-in space-y-4">
      {description ? (
        <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

export function JobPanelPlaceholder({ message }: { message: string }) {
  return (
    <p className="text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-md px-3 py-4">
      {message}
    </p>
  );
}
