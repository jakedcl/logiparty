import Link from "next/link";
import { PrintButton } from "@/components/jobs/print-button";
import type { JobRunSheet } from "@/lib/actions/job-run-sheet";

function fmt(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString();
}

type Props = {
  sheet: JobRunSheet;
  backHref: string;
  backLabel: string;
};

export function JobRunSheetView({ sheet, backHref, backLabel }: Props) {
  const { job } = sheet;

  return (
    <div className="space-y-6 max-w-3xl print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <Link
            href={backHref}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← {backLabel}
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Run sheet</h1>
        </div>
        <PrintButton />
      </div>

      <article className="run-sheet space-y-5 text-sm">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-semibold">{job.name}</h1>
          <p className="text-neutral-600 mt-1">
            {sheet.clientCompanyName} ·{" "}
            <span className="capitalize">{job.status}</span>
            {sheet.jobLeadLabel ? (
              <>
                {" "}
                · Job lead: <strong>{sheet.jobLeadLabel}</strong>
              </>
            ) : null}
          </p>
        </header>

        <section>
          <h2 className="font-semibold text-base mb-2">Windows</h2>
          <dl className="grid gap-1 sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Job</dt>
              <dd>
                {fmt(job.jobStart)} → {fmt(job.jobEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Load-in</dt>
              <dd>
                {fmt(job.loadInStart)} → {fmt(job.loadInEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Load-out</dt>
              <dd>
                {fmt(job.loadOutStart)} → {fmt(job.loadOutEnd)}
              </dd>
            </div>
          </dl>
          {(job.clientPocName || job.clientPocPhone) && (
            <p className="mt-2">
              Client POC:{" "}
              {[job.clientPocName, job.clientPocPhone]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {job.notes ? <p className="mt-2">Notes: {job.notes}</p> : null}
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Locations</h2>
          {sheet.locations.length === 0 ? (
            <p className="text-neutral-500">None</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {sheet.locations.map((loc) => (
                <li key={loc.id}>
                  <span className="font-medium">{loc.label}</span> — {loc.address}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Inventory</h2>
          {sheet.inventory.length === 0 ? (
            <p className="text-neutral-500">None</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-1 pr-2 font-medium">Item</th>
                  <th className="py-1 pr-2 font-medium">Source</th>
                  <th className="py-1 pr-2 font-medium">Assigned</th>
                  <th className="py-1 font-medium">Loaded</th>
                </tr>
              </thead>
              <tbody>
                {sheet.inventory.map((line) => (
                  <tr key={line.id} className="border-b border-neutral-200">
                    <td className="py-1 pr-2">
                      {line.itemSku ? `${line.itemSku} — ` : ""}
                      {line.itemName}
                    </td>
                    <td className="py-1 pr-2 capitalize">{line.itemType}</td>
                    <td className="py-1 pr-2">{line.quantityAssigned}</td>
                    <td className="py-1">{line.quantityLoaded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Fleet</h2>
          {sheet.fleet.length === 0 ? (
            <p className="text-neutral-500">None</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {sheet.fleet.map((v, i) => (
                <li key={`${v.vehicleName}-${i}`}>
                  {v.vehicleName}
                  {v.vehiclePlate ? ` (${v.vehiclePlate})` : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Crew</h2>
          {sheet.crewByPhase.length === 0 ? (
            <p className="text-neutral-500">None</p>
          ) : (
            <div className="space-y-3">
              {sheet.crewByPhase.map((group) => (
                <div key={group.phase}>
                  <h3 className="font-medium capitalize">{group.phase}</h3>
                  <ul className="list-disc pl-5">
                    {group.members.map((m, i) => (
                      <li key={`${m.userLabel}-${i}`}>
                        {m.userLabel} — {m.assignedRole}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Documents</h2>
          {sheet.documentNames.length === 0 ? (
            <p className="text-neutral-500">None</p>
          ) : (
            <ul className="list-disc pl-5">
              {sheet.documentNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
