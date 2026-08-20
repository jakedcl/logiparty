"use client";

import {
  deleteJobLocation,
  updateJobLocation,
} from "@/lib/actions/job-locations";
import {
  DetailFields,
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
    <div className="border rounded p-3 space-y-2">
      <ViewEdit
        editLabel="Edit"
        view={
          <DetailFields
            rows={[
              { label: "Label", value: location.label },
              { label: "Address", value: location.address },
            ]}
          />
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
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-neutral-600">
              Address
              <input
                name="address"
                required
                defaultValue={location.address}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <EditFormActions onCancel={onCancel} saveLabel="Save" />
          </form>
        )}
      />
      <form action={deleteJobLocation}>
        <input type="hidden" name="id" value={location.id} />
        <input type="hidden" name="jobId" value={jobId} />
        <button
          type="submit"
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </form>
    </div>
  );
}
