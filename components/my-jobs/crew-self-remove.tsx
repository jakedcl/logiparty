import { removeMyJobAssignment } from "@/lib/actions/job-crew";
import {
  assignmentPhaseLabel,
  assignmentRoleLabel,
} from "@/lib/format/assignment";
import { Button } from "@/components/ui/button";

type Row = { id: string; phase: string; assignedRole: string };

export function CrewSelfRemoveForms({
  jobId,
  rows,
}: {
  jobId: string;
  rows: Row[];
}) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-[var(--border-subtle)] pt-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Your crew slots
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Can’t make a shift? Remove yourself — managers will see the open slot.
        </p>
      </div>
      {rows.map((row) => (
        <form
          key={row.id}
          action={removeMyJobAssignment}
          className="space-y-2 rounded-md border border-[var(--border-subtle)] p-4"
        >
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="jobId" value={jobId} />
          <p className="text-sm font-medium text-[var(--foreground)]">
            {assignmentPhaseLabel(row.phase)} ·{" "}
            {assignmentRoleLabel(row.assignedRole)}
          </p>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Reason (optional)
            <textarea
              name="reason"
              rows={2}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--foreground)]"
              placeholder="Schedule conflict, illness, etc."
            />
          </label>
          <Button type="submit" variant="outline" className="text-sm">
            Remove me from this slot
          </Button>
        </form>
      ))}
    </section>
  );
}
