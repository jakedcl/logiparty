import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InventorySourceToggle } from "@/components/jobs/inventory-source-toggle";
import { CollapsibleAdd } from "@/components/jobs/collapsible-add";
import { JobDocuments } from "@/components/jobs/job-documents";
import { JobInventoryLineRow } from "@/components/jobs/job-inventory-line-row";
import { JobLocationRow } from "@/components/jobs/job-location-row";
import { JobPanel } from "@/components/jobs/job-panel";
import { JobSummaryEditor } from "@/components/jobs/job-summary-editor";
import { canManageJobs, canUploadDocuments } from "@/lib/auth/permissions";
import {
  addJobInventoryLine,
  listAssignableClientInventory,
  listAssignableOrgInventory,
  listJobInventoryLines,
} from "@/lib/actions/job-inventory";
import {
  assignFleetToJob,
  listAssignableFleetVehicles,
  listJobFleetAssignments,
  unassignFleetFromJob,
} from "@/lib/actions/job-fleet";
import {
  addJobAssignment,
  deleteJobAssignment,
  listCrewCandidates,
  listJobAssignments,
} from "@/lib/actions/job-crew";
import { listJobDocuments } from "@/lib/actions/documents";
import {
  acceptDraftJob,
  deleteJob,
  getJob,
  listJobClientCompanies,
  listJobLeadCandidates,
} from "@/lib/actions/jobs";
import {
  addJobLocation,
  listJobLocations,
} from "@/lib/actions/job-locations";
import { ASSIGNMENT_PHASES, ASSIGNMENT_ROLES } from "@/lib/db/schema";
import { evaluateAutoReady } from "@/lib/jobs/auto-ready";
import { requireSession } from "@/lib/org/context";
import { isStorageConfigured } from "@/lib/storage/r2";

function toLocalInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtWindow(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString();
}

function fmtRange(
  start: Date | null | undefined,
  end: Date | null | undefined
): string {
  if (!start && !end) return "—";
  return `${fmtWindow(start)} → ${fmtWindow(end)}`;
}

const PANEL_LINKS = [
  { href: "#summary", label: "Summary" },
  { href: "#locations", label: "Locations" },
  { href: "#inventory", label: "Inventory" },
  { href: "#fleet", label: "Fleet" },
  { href: "#crew", label: "Crew" },
  { href: "#documents", label: "Documents" },
] as const;

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inv?: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  const { inv } = await searchParams;
  const inventorySource = inv === "org" ? "org" : "client";

  const job = await getJob(session.user.orgId, id);
  if (!job) notFound();

  const [
    companies,
    locations,
    inventoryLines,
    clientItems,
    orgItems,
    fleetAssignments,
    assignableFleet,
    crewAssignments,
    crewCandidates,
    leadCandidates,
    jobDocuments,
  ] = await Promise.all([
    listJobClientCompanies(session.user.orgId),
    listJobLocations(session.user.orgId, id),
    listJobInventoryLines(session.user.orgId, id),
    listAssignableClientInventory(session.user.orgId, job.clientCompanyId),
    listAssignableOrgInventory(session.user.orgId),
    listJobFleetAssignments(session.user.orgId, id),
    listAssignableFleetVehicles(session.user.orgId, id),
    listJobAssignments(session.user.orgId, id),
    listCrewCandidates(session.user.orgId, id),
    listJobLeadCandidates(session.user.orgId),
    listJobDocuments(session.user.orgId, id),
  ]);

  const jobLeadLabel =
    leadCandidates.find((c) => c.userId === job.jobLeadUserId)?.label ?? null;

  const autoReady =
    job.status === "upcoming"
      ? await evaluateAutoReady(session.user.orgId, id)
      : null;

  const pickerItems =
    inventorySource === "org"
      ? orgItems.map((i) => ({
          id: i.id,
          label: `${i.sku} — ${i.name} (qty ${i.totalQuantity})`,
        }))
      : clientItems.map((i) => ({
          id: i.id,
          label: `${i.sku} — ${i.name} (qty ${i.totalQuantity})`,
        }));

  const companyName =
    companies.find((c) => c.id === job.clientCompanyId)?.name ?? "Client";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/jobs"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Jobs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{job.name}</h1>
            <p className="text-sm text-neutral-500">
              {companyName} · <span className="capitalize">{job.status}</span>
              {jobLeadLabel ? (
                <>
                  {" "}
                  · Job lead:{" "}
                  <span className="text-neutral-800">{jobLeadLabel}</span>
                </>
              ) : null}
            </p>
          </div>
          <Link
            href={`/dashboard/jobs/${job.id}/print`}
            className="rounded px-3 py-2 text-sm border border-neutral-300 hover:bg-neutral-50"
          >
            Print run sheet
          </Link>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {PANEL_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full border px-3 py-1 text-neutral-600 hover:bg-neutral-50"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <JobPanel
        id="summary"
        title="Summary"
        description="Job meta, windows, client POC, and internal notes."
      >
        {job.status === "draft" ? (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 space-y-2">
            <p className="font-medium">Client request — draft</p>
            <p className="text-xs">
              Accept to move this job to upcoming so you can assign inventory,
              fleet, and crew.
            </p>
            <form action={acceptDraftJob}>
              <input type="hidden" name="id" value={job.id} />
              <button
                type="submit"
                className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
              >
                Accept request
              </button>
            </form>
          </div>
        ) : null}
        {autoReady ? (
          <div
            className={`mb-4 rounded border px-3 py-2 text-sm ${
              autoReady.eligible
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            <p className="font-medium">
              {autoReady.eligible
                ? "Auto-ready rules met — status flips to ready when you save crew, fleet, or loaded qty."
                : "Auto-ready checklist"}
            </p>
            {!autoReady.eligible ? (
              <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
                {autoReady.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <JobSummaryEditor
          job={{
            id: job.id,
            name: job.name,
            clientCompanyId: job.clientCompanyId,
            status: job.status,
            clientPocName: job.clientPocName,
            clientPocPhone: job.clientPocPhone,
            jobLeadUserId: job.jobLeadUserId,
            notes: job.notes,
          }}
          companies={companies}
          leadCandidates={leadCandidates}
          windows={{
            jobStart: toLocalInputValue(job.jobStart),
            jobEnd: toLocalInputValue(job.jobEnd),
            loadInStart: toLocalInputValue(job.loadInStart),
            loadInEnd: toLocalInputValue(job.loadInEnd),
            loadOutStart: toLocalInputValue(job.loadOutStart),
            loadOutEnd: toLocalInputValue(job.loadOutEnd),
          }}
          windowLabels={{
            job: fmtRange(job.jobStart, job.jobEnd),
            loadIn: fmtRange(job.loadInStart, job.loadInEnd),
            loadOut: fmtRange(job.loadOutStart, job.loadOutEnd),
          }}
        />
      </JobPanel>

      <JobPanel
        id="locations"
        title={`Locations (${locations.length}/5)`}
        description="Up to 5 labels + addresses (e.g. Warehouse, Venue)."
      >
        {locations.length === 0 ? (
          <p className="text-sm text-neutral-500">No locations yet.</p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <JobLocationRow key={loc.id} jobId={job.id} location={loc} />
            ))}
          </div>
        )}

        {locations.length < 5 ? (
          <CollapsibleAdd label="Add location">
            <form action={addJobLocation} className="space-y-2">
              <input type="hidden" name="jobId" value={job.id} />
              <input
                name="label"
                required
                placeholder="Label (e.g. Warehouse)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                name="address"
                required
                placeholder="Address"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
              >
                Add location
              </button>
            </form>
          </CollapsibleAdd>
        ) : (
          <p className="text-sm text-neutral-500">Maximum of 5 locations.</p>
        )}
      </JobPanel>

      <JobPanel
        id="inventory"
        title="Inventory"
        description="Defaults to this job's client catalog; switch to our inventory when needed."
      >
        <InventorySourceToggle jobId={job.id} source={inventorySource} />

        {inventoryLines.length === 0 ? (
          <p className="text-sm text-neutral-500">No inventory assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {inventoryLines.map((line) => (
              <JobInventoryLineRow key={line.id} jobId={job.id} line={line} />
            ))}
          </ul>
        )}

        <CollapsibleAdd label="Assign inventory">
          <form action={addJobInventoryLine} className="space-y-2">
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="itemType" value={inventorySource} />
            {pickerItems.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No {inventorySource} inventory items available. Add them in the
                catalog first.
              </p>
            ) : (
              <>
                <label className="block text-sm text-neutral-600">
                  Item
                  <select
                    name="itemId"
                    required
                    className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {pickerItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-neutral-600">
                  Qty assigned
                  <input
                    name="quantityAssigned"
                    type="number"
                    min={1}
                    required
                    defaultValue={1}
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
                >
                  Assign to job
                </button>
              </>
            )}
          </form>
        </CollapsibleAdd>
      </JobPanel>

      <JobPanel
        id="fleet"
        title="Fleet"
        description="Vehicles assigned to this job (needed for auto-ready). Locked on upcoming/ready jobs until load-out ends."
      >
        {fleetAssignments.length === 0 ? (
          <p className="text-sm text-neutral-500">No vehicles assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {fleetAssignments.map((row) => (
              <li
                key={row.fleetVehicleId}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <p className="text-sm font-medium">{row.vehicleName}</p>
                  {row.vehiclePlate ? (
                    <p className="text-xs text-neutral-500">{row.vehiclePlate}</p>
                  ) : null}
                </div>
                <form action={unassignFleetFromJob}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input
                    type="hidden"
                    name="fleetVehicleId"
                    value={row.fleetVehicleId}
                  />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <CollapsibleAdd label="Assign vehicle">
          <form action={assignFleetToJob} className="space-y-2">
            <input type="hidden" name="jobId" value={job.id} />
            {assignableFleet.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No more active vehicles to assign. Add them under Fleet, or
                remove an assignment first.
              </p>
            ) : (
              <>
                <label className="block text-sm text-neutral-600">
                  Vehicle
                  <select
                    name="fleetVehicleId"
                    required
                    className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {assignableFleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {v.plate ? ` (${v.plate})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
                >
                  Assign vehicle
                </button>
              </>
            )}
          </form>
        </CollapsibleAdd>
      </JobPanel>

      <JobPanel
        id="crew"
        title="Crew"
        description="Load-in / load-out assignments. Staff with approved time-off during this job are hidden."
      >
        {crewAssignments.length === 0 ? (
          <p className="text-sm text-neutral-500">No crew assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {crewAssignments.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between border rounded p-3 gap-3"
              >
                <div>
                  <p className="text-sm font-medium">{row.userLabel}</p>
                  <p className="text-xs text-neutral-500">
                    {row.phase} · {row.assignedRole}
                    {row.userEmail ? ` · ${row.userEmail}` : ""}
                  </p>
                </div>
                <form action={deleteJobAssignment}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="jobId" value={job.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <CollapsibleAdd label="Assign crew">
          <form action={addJobAssignment} className="space-y-2">
            <input type="hidden" name="jobId" value={job.id} />
            {crewCandidates.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No staff members available. Invite or mark users as Staff on the
                Team page.
              </p>
            ) : (
              <>
                <label className="block text-sm text-neutral-600">
                  Person
                  <select
                    name="userId"
                    required
                    className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select…</option>
                    {crewCandidates.map((c) => (
                      <option key={c.userId} value={c.userId}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm text-neutral-600">
                    Phase
                    <select
                      name="phase"
                      required
                      className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                      defaultValue="LoadIn"
                    >
                      {ASSIGNMENT_PHASES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-neutral-600">
                    Role
                    <select
                      name="assignedRole"
                      required
                      className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                      defaultValue="Laborer"
                    >
                      {ASSIGNMENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
                >
                  Assign crew
                </button>
              </>
            )}
          </form>
        </CollapsibleAdd>
      </JobPanel>

      <JobPanel
        id="documents"
        title="Documents"
        description="PDFs and images for this job (permits, overlays, notes)."
      >
        <JobDocuments
          jobId={job.id}
          documents={jobDocuments}
          canUpload={canUploadDocuments(session.user)}
          storageConfigured={isStorageConfigured()}
          currentUserId={session.user.id}
          canDeleteAny={canManageJobs(session.user)}
        />
      </JobPanel>

      <form action={deleteJob}>
        <input type="hidden" name="id" value={job.id} />
        <button
          type="submit"
          className="text-sm text-red-600 hover:text-red-800"
        >
          Delete job
        </button>
      </form>
    </div>
  );
}
