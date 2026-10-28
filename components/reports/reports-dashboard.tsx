import {
  jobStatusBarClass,
  sortJobStatusCounts,
} from "@/lib/jobs/status-display";
import { loadReports } from "@/lib/actions/reports";
import { formatJobDateTime } from "@/lib/format/date";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { StatusBadge } from "@/components/ui/status-badge";

function StatusBar({
  status,
  value,
  max,
}: {
  status: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <StatusBadge status={status} kind="job" />
        <span className="tabular-nums text-[var(--muted)]">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
        <div
          className={`h-full rounded-full ${jobStatusBarClass(status)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export async function ReportsDashboard({
  orgId,
  from,
  to,
}: {
  orgId: string;
  from: Date;
  to: Date;
}) {
  const data = await loadReports(orgId, from, to);
  const jobsByStatus = sortJobStatusCounts(data.jobsByStatus);
  const totalJobs = jobsByStatus.reduce((n, r) => n + r.count, 0);
  const maxStatus = Math.max(...jobsByStatus.map((r) => r.count), 1);
  const maxCrew = Math.max(...data.crewWorkload.map((r) => r.jobs), 1);
  const maxFleet = Math.max(
    ...data.fleetUtilization.map((r) => r.assignments),
    1
  );

  return (
    <div className="space-y-8">
      <ReportsFilters from={from} to={to} />
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Jobs by status</h2>
        {totalJobs === 0 ? (
          <p className="app-empty">No jobs created in this date range.</p>
        ) : (
          <div className="space-y-4">
            {jobsByStatus.map((row) => (
              <StatusBar
                key={row.status}
                status={row.status}
                value={row.count}
                max={maxStatus}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Upcoming load-ins & load-outs</h2>
        {data.upcomingLoadEvents.length === 0 ? (
          <p className="app-empty">Nothing scheduled in upcoming or ready jobs.</p>
        ) : (
          <ul className="lp-table-wrap divide-y divide-[var(--border-subtle)] text-sm">
            {data.upcomingLoadEvents.map((ev) => (
              <li
                key={`${ev.id}-${ev.kind}-${ev.at.toISOString()}`}
                className="flex justify-between gap-3 py-2"
              >
                <span className="font-medium text-[var(--foreground)]">
                  {ev.name}
                </span>
                <span className="text-[var(--muted)]">
                  {ev.kind === "load_in" ? "Load-in" : "Load-out"} ·{" "}
                  {formatJobDateTime(ev.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Most reserved SKUs</h2>
          {data.topReservedSkus.length === 0 ? (
            <p className="app-empty">No active reservations on upcoming jobs.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topReservedSkus.map((row) => (
                <li key={row.sku} className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium text-[var(--foreground)]">
                      {row.sku}
                    </span>{" "}
                    <span className="text-[var(--muted)]">{row.name}</span>
                  </span>
                  <span className="tabular-nums">{row.reserved}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Crew workload</h2>
          {data.crewWorkload.length === 0 ? (
            <p className="app-empty">No crew assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {data.crewWorkload.map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[var(--foreground)]">
                      {row.label}
                    </span>
                    <span className="text-[var(--muted)]">{row.jobs} jobs</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-hover)]">
                    <div
                      className="h-2 rounded-full bg-[var(--primary)]"
                      style={{
                        width: `${Math.round((row.jobs / maxCrew) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Fleet utilization</h2>
        {data.fleetUtilization.length === 0 ? (
          <p className="app-empty">No fleet assignments yet.</p>
        ) : (
          <div className="space-y-3">
            {data.fleetUtilization.map((row) => (
              <div key={row.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">
                    {row.name}
                  </span>
                  <span className="text-[var(--muted)]">
                    {row.assignments} assignments
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-hover)]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)]"
                    style={{
                      width: `${Math.round((row.assignments / maxFleet) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
