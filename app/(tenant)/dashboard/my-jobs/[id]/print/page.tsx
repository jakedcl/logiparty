import { notFound, redirect } from "next/navigation";
import { JobRunSheetView } from "@/components/jobs/job-run-sheet";
import { canViewMyJobs } from "@/lib/auth/permissions";
import { getJobRunSheet } from "@/lib/actions/job-run-sheet";
import { requireSession } from "@/lib/org/context";

export default async function MyJobPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!canViewMyJobs(session.user)) redirect("/dashboard");

  const { id } = await params;
  let sheet;
  try {
    sheet = await getJobRunSheet(session.user.orgId, id);
  } catch {
    redirect("/dashboard/my-jobs");
  }
  if (!sheet) notFound();

  return (
    <JobRunSheetView
      sheet={sheet}
      backHref={`/dashboard/my-jobs/${id}`}
      backLabel="My Job"
    />
  );
}
