import { redirect } from "next/navigation";
import { TimeOffPanel } from "@/components/settings/time-off-panel";
import {
  canReviewAvailability,
  canSubmitAvailability,
} from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";

export default async function SettingsTimeOffPage() {
  const session = await requireSession();
  const canSubmit = canSubmitAvailability(session.user);
  const canReview = canReviewAvailability(session.user);

  if (!canSubmit && !canReview) redirect("/dashboard/settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Time off</h1>
        <p className="text-sm text-neutral-500">
          Request time off. Managers approve before you are assigned to
          overlapping jobs.
        </p>
      </div>

      <TimeOffPanel
        orgId={session.user.orgId}
        canSubmit={canSubmit}
        canReview={canReview}
      />
    </div>
  );
}
