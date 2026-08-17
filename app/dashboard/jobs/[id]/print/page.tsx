import { notFound, redirect } from "next/navigation";
import { JobRunSheetView } from "@/components/jobs/job-run-sheet";
import { canManageJobs } from "@/lib/auth/permissions";
import { getJobRunSheet } from "@/lib/actions/job-run-sheet";
import { requireSession } from "@/lib/org/context";

export default async function JobPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  const sheet = await getJobRunSheet(session.user.orgId, id);
  if (!sheet) notFound();

  return (
    <JobRunSheetView
      sheet={sheet}
      backHref={`/dashboard/jobs/${id}`}
      backLabel="Job"
    />
  );
}
