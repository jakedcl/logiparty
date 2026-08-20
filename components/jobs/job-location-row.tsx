"use client";

import {
  deleteJobLocation,
  updateJobLocation,
} from "@/lib/actions/job-locations";
import { QuietRemove } from "@/components/jobs/quiet-remove";
import {
  EditFormActions,
  ViewEdit,
} from "@/components/ui/view-edit";

export function JobLocationRow({
  jobId,
  location,
}: {
  jobId: string;
  location: { id: string; label: string; address: string };
}) {
  return (
    <div className="flex items-start gap-1 border-b border-neutral-100 last:border-0 py-2.5">
      <div className="min-w-0 flex-1">
        <ViewEdit
          variant="inline"
          editLabel="Edit"
          view={
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {location.label}
              </p>
              <p className="text-sm text-neutral-500 mt-0.5 leading-snug">
                {location.address}
              </p>
            </div>
          }
          edit={({ onCancel }) => (
            <form
              action={async (formData) => {
                await updateJobLocation(formData);
                onCancel();
              }}
              className="space-y-2"
            >
              <input type="hidden" name="id" value={location.id} />
              <input type="hidden" name="jobId" value={jobId} />
              <label className="block text-sm text-neutral-600">
                Label
                <input
                  name="label"
                  required
                  defaultValue={location.label}
                  className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm text-neutral-600">
                Address
                <input
                  name="address"
                  required
                  defaultValue={location.address}
                  className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm"
                />
              </label>
              <EditFormActions onCancel={onCancel} saveLabel="Save" />
            </form>
          )}
        />
      </div>
      <QuietRemove>
        <form action={deleteJobLocation}>
          <input type="hidden" name="id" value={location.id} />
          <input type="hidden" name="jobId" value={jobId} />
          <button type="submit">Remove</button>
        </form>
      </QuietRemove>
    </div>
  );
}
