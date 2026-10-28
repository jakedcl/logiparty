import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { canManageJobs } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard/my-jobs");

  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 90);

  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : now;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="lp-page-title">Reports</h1>
        <p className="lp-page-sub">
          Read-only snapshots for jobs, inventory pressure, crew, and fleet.
        </p>
      </div>
      <ReportsDashboard orgId={session.user.orgId} from={from} to={to} />
      <p className="text-sm text-[var(--muted)]">
        <Link href="/dashboard" className="lp-link-quiet">
          ← Dashboard
        </Link>
      </p>
    </div>
  );
}
