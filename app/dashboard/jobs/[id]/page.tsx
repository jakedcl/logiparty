import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InventorySourceToggle } from "@/components/jobs/inventory-source-toggle";
import {
  JobPanel,
  JobPanelPlaceholder,
} from "@/components/jobs/job-panel";
import { canManageJobs } from "@/lib/auth/permissions";
import {
  addJobInventoryLine,
  deleteJobInventoryLine,
  listAssignableClientInventory,
  listAssignableOrgInventory,
  listJobInventoryLines,
  updateJobInventoryLine,
} from "@/lib/actions/job-inventory";
import {
  deleteJob,
  getJob,
  listJobClientCompanies,
  updateJob,
} from "@/lib/actions/jobs";
import {
  addJobLocation,
  deleteJobLocation,
  listJobLocations,
  updateJobLocation,
} from "@/lib/actions/job-locations";
import { JOB_STATUSES } from "@/lib/db/schema";
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

  const [companies, locations, inventoryLines, clientItems, orgItems] =
    await Promise.all([
      listJobClientCompanies(session.user.orgId),
      listJobLocations(session.user.orgId, id),
      listJobInventoryLines(session.user.orgId, id),
      listAssignableClientInventory(
        session.user.orgId,
        job.clientCompanyId
      ),
      listAssignableOrgInventory(session.user.orgId),
    ]);

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
        <h1 className="text-2xl font-semibold mt-2 mb-1">{job.name}</h1>
        <p className="text-sm text-neutral-500">
          {companyName} · <span className="capitalize">{job.status}</span>
        </p>
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
                <p className="text-xs text-neutral-500">
                  Loaded {line.quantityLoaded} / assigned {line.quantityAssigned}
                </p>
                <form action={updateJobInventoryLine} className="flex gap-2 items-end">
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
        description="Vehicles assigned to this job (needed for auto-ready)."
      >
        <JobPanelPlaceholder message="Fleet assignment arrives in M3-6." />
      </JobPanel>

      <JobPanel
        id="crew"
        title="Crew"
        description="Load-in / load-out assignments and job lead."
      >
        <JobPanelPlaceholder message="Crew assignments arrive in M3-7 / M3-8." />
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
