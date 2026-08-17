import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InventorySourceToggle } from "@/components/jobs/inventory-source-toggle";
import { JobDocuments } from "@/components/jobs/job-documents";
import {
  JobPanel,
} from "@/components/jobs/job-panel";
import { canManageJobs, canUploadDocuments } from "@/lib/auth/permissions";
import {
  addJobInventoryLine,
  deleteJobInventoryLine,
  listAssignableClientInventory,
  listAssignableOrgInventory,
  listJobInventoryLines,
  updateJobInventoryLine,
  updateQuantityLoaded,
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
  updateJob,
} from "@/lib/actions/jobs";
import {
  addJobLocation,
  deleteJobLocation,
  listJobLocations,
  updateJobLocation,
} from "@/lib/actions/job-locations";
import { ASSIGNMENT_PHASES, ASSIGNMENT_ROLES, JOB_STATUSES } from "@/lib/db/schema";
import { evaluateAutoReady } from "@/lib/jobs/auto-ready";
import { requireSession } from "@/lib/org/context";

function toLocalInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
      listAssignableClientInventory(
        session.user.orgId,
        job.clientCompanyId
      ),
      listAssignableOrgInventory(session.user.orgId),
      listJobFleetAssignments(session.user.orgId, id),
      listAssignableFleetVehicles(session.user.orgId, id),
      listJobAssignments(session.user.orgId, id),
      listCrewCandidates(session.user.orgId),
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
        <form action={updateJob} className="space-y-3">
          <input type="hidden" name="id" value={job.id} />
          <input
            name="name"
            required
            defaultValue={job.name}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-neutral-600">
              Client company
              <select
                name="clientCompanyId"
                required
                defaultValue={job.clientCompanyId}
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-neutral-600">
              Status
              <select
                name="status"
                defaultValue={job.status}
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-neutral-600">
              Job start
              <input
                type="datetime-local"
                name="jobStart"
                defaultValue={toLocalInputValue(job.jobStart)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Job end
              <input
                type="datetime-local"
                name="jobEnd"
                defaultValue={toLocalInputValue(job.jobEnd)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Load-in start
              <input
                type="datetime-local"
                name="loadInStart"
                defaultValue={toLocalInputValue(job.loadInStart)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Load-in end
              <input
                type="datetime-local"
                name="loadInEnd"
                defaultValue={toLocalInputValue(job.loadInEnd)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Load-out start
              <input
                type="datetime-local"
                name="loadOutStart"
                defaultValue={toLocalInputValue(job.loadOutStart)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Load-out end
              <input
                type="datetime-local"
                name="loadOutEnd"
                defaultValue={toLocalInputValue(job.loadOutEnd)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="clientPocName"
              placeholder="Client POC name"
              defaultValue={job.clientPocName ?? ""}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              name="clientPocPhone"
              placeholder="Client POC phone"
              defaultValue={job.clientPocPhone ?? ""}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <label className="block text-sm text-neutral-600">
            Job lead (who to ask)
            <select
              name="jobLeadUserId"
              defaultValue={job.jobLeadUserId ?? ""}
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">None</option>
              {leadCandidates.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Internal notes"
            defaultValue={job.notes ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
          >
            Save summary
          </button>
        </form>
      </JobPanel>

      <JobPanel
        id="locations"
        title={`Locations (${locations.length}/5)`}
        description="Up to 5 labels + addresses (e.g. Warehouse, Venue)."
      >
        {locations.map((loc) => (
          <div key={loc.id} className="border rounded p-3 space-y-2">
            <form action={updateJobLocation} className="space-y-2">
              <input type="hidden" name="id" value={loc.id} />
              <input type="hidden" name="jobId" value={job.id} />
              <input
                name="label"
                required
                defaultValue={loc.label}
                placeholder="Label"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                name="address"
                required
                defaultValue={loc.address}
                placeholder="Address"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded px-3 py-1.5 text-sm border border-neutral-300"
              >
                Save
              </button>
            </form>
            <form action={deleteJobLocation}>
              <input type="hidden" name="id" value={loc.id} />
              <input type="hidden" name="jobId" value={job.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </form>
          </div>
        ))}

        {locations.length < 5 ? (
          <form action={addJobLocation} className="space-y-2 border-t pt-3">
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
        ) : (
          <p className="text-sm text-neutral-500">Maximum of 5 locations.</p>
        )}
      </JobPanel>

      <JobPanel
        id="inventory"
        title="Inventory"
        description="Defaults to this job's client catalog; switch to org items when needed."
      >
        <InventorySourceToggle jobId={job.id} source={inventorySource} />

        {inventoryLines.length === 0 ? (
          <p className="text-sm text-neutral-500">No inventory assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {inventoryLines.map((line) => (
              <li key={line.id} className="border rounded p-3 space-y-2">
                <p className="text-sm font-medium">
                  {line.itemSku ? `${line.itemSku} — ` : ""}
                  {line.itemName}{" "}
                  <span className="text-neutral-500 font-normal">
                    ({line.itemType})
                  </span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <form
                    action={updateJobInventoryLine}
                    className="flex gap-2 items-end"
                  >
                    <input type="hidden" name="id" value={line.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <label className="text-sm text-neutral-600">
                      Assigned qty
                      <input
                        name="quantityAssigned"
                        type="number"
                        min={1}
                        required
                        defaultValue={line.quantityAssigned}
                        className="mt-1 w-28 border rounded px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded px-3 py-2 text-sm border border-neutral-300 h-[42px]"
                    >
                      Save
                    </button>
                  </form>
                  <form
                    action={updateQuantityLoaded}
                    className="flex gap-2 items-end"
                  >
                    <input type="hidden" name="id" value={line.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <label className="text-sm text-neutral-600">
                      Loaded qty
                      <input
                        name="quantityLoaded"
                        type="number"
                        min={0}
                        max={line.quantityAssigned}
                        required
                        defaultValue={line.quantityLoaded}
                        className="mt-1 w-28 border rounded px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded px-3 py-2 text-sm border border-neutral-300 h-[42px]"
                    >
                      Save
                    </button>
                  </form>
                </div>
                <form action={deleteJobInventoryLine}>
                  <input type="hidden" name="id" value={line.id} />
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

        <form action={addJobInventoryLine} className="space-y-2 border-t pt-3">
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

        <form action={assignFleetToJob} className="space-y-2 border-t pt-3">
          <input type="hidden" name="jobId" value={job.id} />
          {assignableFleet.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No more active vehicles to assign. Add them under Fleet, or remove
              an assignment first.
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
      </JobPanel>

      <JobPanel
        id="crew"
        title="Crew"
        description="Load-in / load-out assignments. Manager-only users are excluded from the picker."
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

        <form action={addJobAssignment} className="space-y-2 border-t pt-3">
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
