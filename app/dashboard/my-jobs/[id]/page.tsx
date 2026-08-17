import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  canUpdateQuantityLoaded,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { updateQuantityLoaded } from "@/lib/actions/job-inventory";
import { getMyJob, listMyJobInventory } from "@/lib/actions/my-jobs";
import { withOrgQuery } from "@/lib/db";
import {
  clientInventoryItems,
  inventoryItems,
  type ClientInventoryItem,
  type InventoryItem,
} from "@/lib/db/schema";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

function fmt(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString();
}

export default async function MyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  const [job, tags] = await Promise.all([
    getMyJob(session.user.orgId, id),
    getSessionStaffTags(session),
  ]);
  if (!job) notFound();

  const [lines, clientItems, orgItems] = await Promise.all([
    listMyJobInventory(session.user.orgId, id),
    withOrgQuery<ClientInventoryItem[]>(session.user.orgId, (database) =>
      database
        .select()
        .from(clientInventoryItems)
        .where(eq(clientInventoryItems.orgId, session.user.orgId))
    ),
    withOrgQuery<InventoryItem[]>(session.user.orgId, (database) =>
      database
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.orgId, session.user.orgId))
    ),
  ]);

  const canEditLoaded = canUpdateQuantityLoaded(session.user, tags);
  const clientById = new Map(clientItems.map((i) => [i.id, i]));
  const orgById = new Map(orgItems.map((i) => [i.id, i]));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/my-jobs"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← My Jobs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{job.name}</h1>
            <p className="text-sm text-neutral-500">
              {job.clientCompanyName} ·{" "}
              <span className="capitalize">{job.status}</span>
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              Your assignment:{" "}
              {job.myPhases
                .map((p, i) => `${p} (${job.myRoles[i] ?? "—"})`)
                .join(" · ")}
            </p>
          </div>
          <Link
            href={`/dashboard/my-jobs/${job.id}/print`}
            className="rounded px-3 py-2 text-sm border border-neutral-300 hover:bg-neutral-50"
          >
            Print run sheet
          </Link>
        </div>
      </div>

      <section className="border rounded p-4 space-y-2 text-sm">
        <h2 className="font-medium">Windows</h2>
        <p>
          Job: {fmt(job.jobStart)} → {fmt(job.jobEnd)}
        </p>
        <p>
          Load-in: {fmt(job.loadInStart)} → {fmt(job.loadInEnd)}
        </p>
        <p>
          Load-out: {fmt(job.loadOutStart)} → {fmt(job.loadOutEnd)}
        </p>
        {job.notes ? (
          <p className="text-neutral-600 pt-2 border-t">Notes: {job.notes}</p>
        ) : null}
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-medium text-sm">Inventory</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-neutral-500">No inventory on this job.</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => {
              const name =
                line.itemType === "client" && line.clientItemId
                  ? clientById.get(line.clientItemId)?.name
                  : line.orgItemId
                    ? orgById.get(line.orgItemId)?.name
                    : null;
              return (
                <li key={line.id} className="border rounded p-3 space-y-2">
                  <p className="text-sm font-medium">
                    {name ?? "Item"}{" "}
                    <span className="text-neutral-500 font-normal">
                      ({line.itemType})
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Loaded {line.quantityLoaded} / assigned{" "}
                    {line.quantityAssigned}
                  </p>
                  {canEditLoaded ? (
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
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
