import { redirect } from "next/navigation";
import {
  canReviewAvailability,
  canSubmitAvailability,
} from "@/lib/auth/permissions";
import {
  listMyAvailabilityRequests,
  listPendingAvailabilityRequests,
  reviewAvailabilityRequest,
  submitAvailabilityRequest,
} from "@/lib/actions/availability";
import { requireSession } from "@/lib/org/context";

function fmt(d: Date): string {
  return d.toLocaleString();
}

function statusClass(status: string): string {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-900";
    case "Approved":
      return "bg-emerald-100 text-emerald-900";
    case "Denied":
      return "bg-red-100 text-red-900";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default async function AvailabilityPage() {
  const session = await requireSession();
  const canSubmit = canSubmitAvailability(session.user);
  const canReview = canReviewAvailability(session.user);

  if (!canSubmit && !canReview) redirect("/dashboard");

  const [mine, pending] = await Promise.all([
    canSubmit ? listMyAvailabilityRequests(session.user.orgId) : [],
    canReview ? listPendingAvailabilityRequests(session.user.orgId) : [],
  ]);

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Availability</h1>
        <p className="text-sm text-neutral-500">
          Request time off. Managers approve before you are assigned to overlapping
          jobs.
        </p>
      </div>

      {canReview ? (
        <section className="space-y-3">
          <h2 className="font-medium">Pending review ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-neutral-500">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((req) => (
                <li key={req.id} className="border rounded-lg bg-white p-4 space-y-2">
                  <p className="font-medium text-sm">{req.userLabel}</p>
                  <p className="text-sm text-neutral-600">
                    {fmt(req.startTime)} → {fmt(req.endTime)}
                  </p>
                  {req.reason ? (
                    <p className="text-sm text-neutral-500">{req.reason}</p>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <form action={reviewAvailabilityRequest}>
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="status" value="Approved" />
                      <button
                        type="submit"
                        className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reviewAvailabilityRequest}>
                      <input type="hidden" name="id" value={req.id} />
                      <input type="hidden" name="status" value="Denied" />
                      <button
                        type="submit"
                        className="rounded px-3 py-1.5 text-sm border border-neutral-300"
                      >
                        Deny
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canSubmit ? (
        <>
          <section className="border rounded-lg p-4 bg-white space-y-3">
            <h2 className="font-medium">Request time off</h2>
            <form action={submitAvailabilityRequest} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-neutral-600 block">
                  Start
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-base"
                  />
                </label>
                <label className="text-sm text-neutral-600 block">
                  End
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-base"
                  />
                </label>
              </div>
              <textarea
                name="reason"
                rows={2}
                placeholder="Reason (optional)"
                className="w-full border rounded-lg px-3 py-2 text-base"
              />
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
              >
                Submit request
              </button>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Your requests</h2>
            {mine.length === 0 ? (
              <p className="text-sm text-neutral-500">No requests yet.</p>
            ) : (
              <ul className="divide-y border rounded-lg bg-white">
                {mine.map((req) => (
                  <li key={req.id} className="px-4 py-3 text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p>
                        {fmt(req.startTime)} → {fmt(req.endTime)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${statusClass(req.status)}`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.reason ? (
                      <p className="text-neutral-500">{req.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
