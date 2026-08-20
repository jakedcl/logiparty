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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Availability</h1>
        <p className="text-sm text-neutral-500">
          Request time off. Managers approve before you are assigned to
          overlapping jobs.
        </p>
      </div>

      {canReview ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-800">
            Pending review
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({pending.length})
            </span>
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">No pending requests.</p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[560px] text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium">Person</th>
                    <th className="py-2 px-3 font-medium">Window</th>
                    <th className="py-2 px-3 font-medium">Reason</th>
                    <th className="py-2 px-3 font-medium w-[9rem] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-neutral-100 last:border-0 align-top hover:bg-neutral-50/80"
                    >
                      <td className="py-2 px-3 font-medium text-neutral-900 whitespace-nowrap">
                        {req.userLabel}
                      </td>
                      <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                        {fmt(req.startTime)} → {fmt(req.endTime)}
                      </td>
                      <td className="py-2 px-3 text-neutral-500">
                        {req.reason || "—"}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <form
                          action={reviewAvailabilityRequest}
                          className="inline"
                        >
                          <input type="hidden" name="id" value={req.id} />
                          <input type="hidden" name="status" value="Approved" />
                          <button
                            type="submit"
                            className="text-sm text-neutral-700 hover:text-neutral-900 font-medium mr-3"
                          >
                            Approve
                          </button>
                        </form>
                        <form
                          action={reviewAvailabilityRequest}
                          className="inline"
                        >
                          <input type="hidden" name="id" value={req.id} />
                          <input type="hidden" name="status" value="Denied" />
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Deny
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {canSubmit ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-800">
            Your requests
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({mine.length})
            </span>
          </h2>
          {mine.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">
              No requests yet. Use + Request time off below.
            </p>
          ) : (
            <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[480px] text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
                    <th className="py-2 px-3 font-medium">Window</th>
                    <th className="py-2 px-3 font-medium">Reason</th>
                    <th className="py-2 px-3 font-medium w-[6rem]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="py-2 px-3 text-neutral-700 whitespace-nowrap">
                        {fmt(req.startTime)} → {fmt(req.endTime)}
                      </td>
                      <td className="py-2 px-3 text-neutral-500">
                        {req.reason || "—"}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${statusClass(req.status)}`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className="group border-t border-neutral-200 pt-4">
            <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="text-neutral-400 group-open:hidden" aria-hidden>
                  +
                </span>
                <span
                  className="hidden text-neutral-400 group-open:inline"
                  aria-hidden
                >
                  −
                </span>
                Request time off
              </span>
            </summary>
            <form
              action={submitAvailabilityRequest}
              className="mt-3 space-y-3 max-w-xl"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-neutral-500 block">
                  Start
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-neutral-500 block">
                  End
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <label className="block text-xs text-neutral-500">
                Reason
                <textarea
                  name="reason"
                  rows={2}
                  placeholder="Optional"
                  className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
              >
                Submit request
              </button>
            </form>
          </details>
        </section>
      ) : null}
    </div>
  );
}
