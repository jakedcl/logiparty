import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canManageJobs } from "@/lib/auth/permissions";
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  const job = await getJob(session.user.orgId, id);
  if (!job) notFound();

  const [companies, locations] = await Promise.all([
    listJobClientCompanies(session.user.orgId),
    listJobLocations(session.user.orgId, id),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/dashboard/jobs"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Jobs
        </Link>
        <h1 className="text-2xl font-semibold mt-2 mb-1">{job.name}</h1>
        <p className="text-sm text-neutral-500">Status: {job.status}</p>
      </div>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-medium mb-3">Edit job</h2>
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
            Save
          </button>
        </form>
      </section>

      <section className="border rounded-lg p-4 bg-white space-y-4">
        <div>
          <h2 className="font-medium">Locations ({locations.length}/5)</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Up to 5 labels + addresses (e.g. Warehouse, Venue).
          </p>
        </div>

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
      </section>

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
