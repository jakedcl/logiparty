import { redirect } from "next/navigation";
import { ActivityLogPanel } from "@/components/settings/activity-log-panel";
import { canManageJobs } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export default async function SettingsActivityPage() {
  const session = await requireSession();
  if (!canManageJobs(session.user)) redirect("/dashboard/settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Activity log</h1>
        <p className="text-sm text-neutral-500">
          Recent actions in your organization. Managers only.
        </p>
      </div>

      <ActivityLogPanel orgId={session.user.orgId} />
    </div>
  );
}
