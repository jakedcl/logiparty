import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalJob } from "@/lib/actions/portal-jobs";
import { requireSession } from "@/lib/org/context";

function fmt(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString();
}

export default async function PortalJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const job = await getPortalJob(session.user.orgId, id);
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/jobs"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Jobs
        </Link>
        <h1 className="text-2xl font-semibold mt-2 mb-1">{job.name}</h1>
        <p className="text-sm text-neutral-500 capitalize">{job.status}</p>
      </div>

      {job.status === "draft" ? (
        <p className="text-sm border rounded-lg bg-amber-50 border-amber-200 text-amber-950 px-4 py-3">
          This request is waiting for the team to accept. You cannot edit it.
        </p>
      ) : null}

      <section className="border rounded-lg bg-white p-4 space-y-2 text-sm">
        <h2 className="font-medium">Windows</h2>
        <p>Job: {fmt(job.jobStart)} → {fmt(job.jobEnd)}</p>
        <p>Load-in: {fmt(job.loadInStart)} → {fmt(job.loadInEnd)}</p>
        <p>Load-out: {fmt(job.loadOutStart)} → {fmt(job.loadOutEnd)}</p>
        {(job.clientPocName || job.clientPocPhone) && (
          <p className="pt-2 border-t">
            On-site contact:{" "}
            {[job.clientPocName, job.clientPocPhone].filter(Boolean).join(" · ")}
          </p>
        )}
        {job.notes ? (
          <p className="pt-2 border-t text-neutral-700">Notes: {job.notes}</p>
        ) : null}
      </section>
    </div>
  );
}
