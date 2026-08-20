import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InventorySourceToggle } from "@/components/jobs/inventory-source-toggle";
import { CollapsibleAdd } from "@/components/jobs/collapsible-add";
import { JobDocuments } from "@/components/jobs/job-documents";
import { JobInventoryLineRow } from "@/components/jobs/job-inventory-line-row";
import { JobLocationRow } from "@/components/jobs/job-location-row";
import { JobPanel } from "@/components/jobs/job-panel";
import { QuietRemove } from "@/components/jobs/quiet-remove";
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
  denyDraftJob,
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
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

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

const JOB_TABS = [
  { id: "summary", label: "Summary" },
  { id: "locations", label: "Locations" },
  { id: "inventory", label: "Inventory" },
  { id: "fleet", label: "Fleet" },
  { id: "crew", label: "Crew" },
  { id: "documents", label: "Documents" },
] as const;

type JobTabId = (typeof JOB_TABS)[number]["id"];

function parseTab(raw: string | undefined): JobTabId {
  const match = JOB_TABS.find((t) => t.id === raw);
  return match?.id ?? "summary";
}

function statusTone(status: string): string {
  switch (status) {
    case "draft":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "upcoming":
      return "bg-sky-50 text-sky-900 ring-sky-200";
    case "ready":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    case "completed":
      return "bg-neutral-100 text-neutral-600 ring-neutral-200";
    case "denied":
      return "bg-red-50 text-red-900 ring-red-200";
    default:
      return "bg-neutral-100 text-neutral-700 ring-neutral-200";
  }
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ inv?: string; tab?: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  const { inv, tab: tabRaw } = await searchParams;
  const tab = parseTab(tabRaw);
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

  const jobId = job.id;

  function tabHref(next: JobTabId): string {
    const q = new URLSearchParams();
    q.set("tab", next);
    if (next === "inventory" && inventorySource === "org") {
      q.set("inv", "org");
    }
    return `/dashboard/jobs/${jobId}?${q.toString()}`;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <Link
          href="/dashboard/jobs"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Jobs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {job.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusTone(job.status)}`}
              >
                {job.status}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {companyName}
              {jobLeadLabel ? (
                <>
                  {" "}
                  · Lead{" "}
                  <span className="text-neutral-800">{jobLeadLabel}</span>
                </>
              ) : null}
            </p>
          </div>
          <Link
            href={`/dashboard/jobs/${job.id}/print`}
            className="rounded-md px-3 py-2 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shrink-0"
          >
            Print run sheet
          </Link>
        </div>
      </div>

      <nav
        className="flex gap-0 overflow-x-auto border-b border-neutral-200 -mx-1 px-1"
        aria-label="Job sections"
      >
        {JOB_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`relative shrink-0 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "font-medium text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t.label}
              {t.id === "locations" && locations.length > 0 ? (
                <span className="ml-1 text-neutral-400 font-normal">
                  {locations.length}
                </span>
              ) : null}
              {t.id === "inventory" && inventoryLines.length > 0 ? (
                <span className="ml-1 text-neutral-400 font-normal">
                  {inventoryLines.length}
                </span>
              ) : null}
              {t.id === "fleet" && fleetAssignments.length > 0 ? (
                <span className="ml-1 text-neutral-400 font-normal">
                  {fleetAssignments.length}
                </span>
              ) : null}
              {t.id === "crew" && crewAssignments.length > 0 ? (
                <span className="ml-1 text-neutral-400 font-normal">
                  {crewAssignments.length}
                </span>
              ) : null}
              {t.id === "documents" && jobDocuments.length > 0 ? (
                <span className="ml-1 text-neutral-400 font-normal">
                  {jobDocuments.length}
                </span>
              ) : null}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-px h-0.5 bg-neutral-900"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === "summary" ? (
        <JobPanel description="Job meta, windows, client POC, and internal notes.">
          {job.status === "draft" ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 space-y-2">
              <p className="font-medium">Client request — draft</p>
              <p className="text-xs">
                Accept to move this job to upcoming so you can assign inventory,
                fleet, and crew. Deny if you will not take the request.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <form action={acceptDraftJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <button
                    type="submit"
                    className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
                  >
                    Accept request
                  </button>
                </form>
                <form action={denyDraftJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <ConfirmSubmitButton
                    message="Deny this client job request? They will see it as denied."
                    className="rounded px-3 py-1.5 text-sm font-medium border border-red-300 bg-white text-red-700 hover:bg-red-50"
                  >
                    Deny
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ) : null}
          {job.status === "denied" ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-950">
              <p className="font-medium">Request denied</p>
              <p className="text-xs mt-1">
                This client portal request was rejected. It will not move to
                upcoming.
              </p>
            </div>
          ) : null}
          {autoReady ? (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
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
          <form action={deleteJob} className="pt-6 border-t border-neutral-100">
            <input type="hidden" name="id" value={job.id} />
            <button
              type="submit"
              className="text-sm text-neutral-400 hover:text-red-700"
            >
              Delete job
            </button>
          </form>
        </JobPanel>
      ) : null}

      {tab === "locations" ? (
        <JobPanel description="Up to 5 labels + addresses (e.g. Warehouse, Venue).">
          {locations.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">No locations yet.</p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white px-3">
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
                  className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
                />
                <input
                  name="address"
                  required
                  placeholder="Address"
                  className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
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
      ) : null}

      {tab === "inventory" ? (
        <JobPanel description="Defaults to this job's client catalog; switch to our inventory when needed.">
          <InventorySourceToggle jobId={job.id} source={inventorySource} />

          {inventoryLines.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">
              No inventory assigned yet.
            </p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium w-[6.5rem]">SKU</th>
                    <th className="py-2 px-3 font-medium">Item</th>
                    <th className="py-2 px-3 font-medium w-[11rem]">Qty</th>
                    <th className="py-2 px-2 font-medium w-10">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLines.map((line) => (
                    <JobInventoryLineRow
                      key={line.id}
                      jobId={job.id}
                      line={line}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
                      className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
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
                      className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm"
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
      ) : null}

      {tab === "fleet" ? (
        <JobPanel description="Vehicles assigned to this job (needed for auto-ready). Locked on upcoming/ready jobs until load-out ends.">
          {fleetAssignments.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">
              No vehicles assigned yet.
            </p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium">Vehicle</th>
                    <th className="py-2 px-3 font-medium">Plate</th>
                    <th className="py-2 px-2 font-medium w-10">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fleetAssignments.map((row) => (
                    <tr
                      key={row.fleetVehicleId}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="py-2 px-3 font-medium text-neutral-900">
                        {row.vehicleName}
                      </td>
                      <td className="py-2 px-3 text-neutral-500">
                        {row.vehiclePlate ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <QuietRemove>
                          <form action={unassignFleetFromJob}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input
                              type="hidden"
                              name="fleetVehicleId"
                              value={row.fleetVehicleId}
                            />
                            <button type="submit">Remove</button>
                          </form>
                        </QuietRemove>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
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
      ) : null}

      {tab === "crew" ? (
        <JobPanel description="Load-in / load-out assignments. Staff with approved time-off during this job are hidden.">
          {crewAssignments.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">No crew assigned yet.</p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium">Person</th>
                    <th className="py-2 px-3 font-medium">Phase</th>
                    <th className="py-2 px-3 font-medium">Role</th>
                    <th className="py-2 px-2 font-medium w-10">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {crewAssignments.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="py-2 px-3">
                        <p className="font-medium text-neutral-900">
                          {row.userLabel}
                        </p>
                        {row.userEmail ? (
                          <p className="text-xs text-neutral-500">
                            {row.userEmail}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-2 px-3 text-neutral-700">{row.phase}</td>
                      <td className="py-2 px-3 text-neutral-700">
                        {row.assignedRole}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <QuietRemove>
                          <form action={deleteJobAssignment}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="jobId" value={job.id} />
                            <button type="submit">Remove</button>
                          </form>
                        </QuietRemove>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
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
                        className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
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
                        className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
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
      ) : null}

      {tab === "documents" ? (
        <JobPanel description="PDFs and images for this job (permits, overlays, notes).">
          <JobDocuments
            jobId={job.id}
            documents={jobDocuments}
            canUpload={canUploadDocuments(session.user)}
            storageConfigured={isStorageConfigured()}
            currentUserId={session.user.id}
            canDeleteAny={canManageJobs(session.user)}
          />
        </JobPanel>
      ) : null}
    </div>
  );
}
