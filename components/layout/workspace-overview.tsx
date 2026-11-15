type Props = { attentionCount: number | null; activeCount: number; readyCount: number };

export function WorkspaceOverview({ attentionCount, activeCount, readyCount }: Props) {
  return (
    <dl className="lp-metric-grid lp-metric-grid-three" aria-label="Workspace overview">
      {[
        { label: "Needs attention", value: attentionCount ?? "—", detail: attentionCount === null ? "Inbox unavailable" : "recent inbox items" },
        { label: "Active jobs", value: activeCount, detail: "upcoming or ready" },
        { label: "Ready jobs", value: readyCount, detail: "marked ready to go" },
      ].map((metric) => (
        <div className="lp-metric" key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>
            <span className="lp-metric-value">{metric.value}</span>
            <span className="lp-metric-detail">{metric.detail}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
