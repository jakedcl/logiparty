import { loadingProgress } from "@/lib/jobs/loading-progress";

type Props = {
  inventoryLines: readonly { quantityAssigned: number; quantityLoaded: number }[];
  fleetCount: number;
  loadInCrewCount: number;
  loadOutCrewCount: number;
};

/** Read-only overview; the job status and existing readiness rules stay separate. */
export function JobProgress({ inventoryLines, fleetCount, loadInCrewCount, loadOutCrewCount }: Props) {
  const progress = loadingProgress(inventoryLines);
  return (
    <dl className="lp-metric-grid" aria-label="Job preparation">
      <div className="lp-metric">
        <dt>Inventory loaded</dt>
        <dd>
          <span className="lp-metric-value">{progress.totalLines ? `${progress.loadedLines} / ${progress.totalLines}` : "—"}</span>
          <span className="lp-metric-detail">{progress.totalLines ? `item lines · ${progress.loadedUnits} of ${progress.assignedUnits} units` : "No inventory assigned"}</span>
          {progress.totalLines > 0 ? (
            <progress className="lp-loading-progress" max={progress.totalLines} value={progress.loadedLines} aria-label="Fully loaded inventory lines" />
          ) : null}
        </dd>
      </div>
      {[
        { label: "Fleet", value: fleetCount, detail: "vehicles assigned" },
        { label: "Load-in crew", value: loadInCrewCount, detail: "crew slots assigned" },
        { label: "Load-out crew", value: loadOutCrewCount, detail: "crew slots assigned" },
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
