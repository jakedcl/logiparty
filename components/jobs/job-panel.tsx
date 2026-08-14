type JobPanelProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function JobPanel({ id, title, description, children }: JobPanelProps) {
  return (
    <section
      id={id}
      className="border rounded-lg p-4 bg-white space-y-4 scroll-mt-4"
    >
      <div>
        <h2 className="font-medium">{title}</h2>
        {description ? (
          <p className="text-xs text-neutral-500 mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function JobPanelPlaceholder({ message }: { message: string }) {
  return (
    <p className="text-sm text-neutral-500 border border-dashed rounded-md px-3 py-4">
      {message}
    </p>
  );
}
