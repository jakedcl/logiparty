import { loadReports } from "@/lib/actions/reports";
import { formatJobDateTime } from "@/lib/format/date";
import { ReportsFilters } from "@/components/reports/reports-filters";

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-[var(--muted)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-hover)]">
        <div
          className="h-2 rounded-full bg-[var(--primary)]"
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
  const maxStatus = Math.max(...data.jobsByStatus.map((r) => r.count), 1);
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
        <div className="space-y-3">
          {data.jobsByStatus.map((row) => (
            <Bar
              key={row.status}
              label={row.status}
              value={row.count}
              max={maxStatus}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Upcoming load-ins & load-outs</h2>
        {data.upcomingLoadEvents.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing scheduled yet.</p>
        ) : (
          <ul className="lp-table-wrap divide-y divide-[var(--border-subtle)] text-sm">
            {data.upcomingLoadEvents.map((ev) => (
              <li
                key={`${ev.id}-${ev.kind}-${ev.at.toISOString()}`}
                className="flex justify-between gap-3 py-2"
              >
                <span>{ev.name}</span>
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
            <p className="text-sm text-[var(--muted)]">No active reservations.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topReservedSkus.map((row) => (
                <li key={row.sku} className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium">{row.sku}</span>{" "}
                    <span className="text-[var(--muted)]">{row.name}</span>
                  </span>
                  <span>{row.reserved}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Crew workload</h2>
          <div className="space-y-3">
            {data.crewWorkload.map((row) => (
              <Bar
                key={row.label}
                label={row.label}
                value={row.jobs}
                max={maxCrew}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Fleet utilization</h2>
        <div className="space-y-3">
          {data.fleetUtilization.map((row) => (
            <Bar
              key={row.name}
              label={row.name}
              value={row.assignments}
              max={maxFleet}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
