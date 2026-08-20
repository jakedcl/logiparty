"use client";

import { updateJob } from "@/lib/actions/jobs";
import { JOB_STATUSES, type JobStatus } from "@/lib/db/schema";
import {
  DetailFields,
  EditFormActions,
  ViewEdit,
} from "@/components/ui/view-edit";

export type JobSummaryEditorProps = {
  job: {
    id: string;
    name: string;
    clientCompanyId: string;
    status: JobStatus;
    clientPocName: string | null;
    clientPocPhone: string | null;
    jobLeadUserId: string | null;
    notes: string | null;
  };
  companies: { id: string; name: string }[];
  leadCandidates: { userId: string; label: string }[];
  /** Local `datetime-local` values for the edit form */
  windows: {
    jobStart: string;
    jobEnd: string;
    loadInStart: string;
    loadInEnd: string;
    loadOutStart: string;
    loadOutEnd: string;
  };
  /** Human-readable window labels for view mode */
  windowLabels: {
    job: string;
    loadIn: string;
    loadOut: string;
  };
};

function dash(v: string | null | undefined) {
  const t = v?.trim();
  return t ? t : null;
}

export function JobSummaryEditor({
  job,
  companies,
  leadCandidates,
  windows,
  windowLabels,
}: JobSummaryEditorProps) {
  const companyName =
    companies.find((c) => c.id === job.clientCompanyId)?.name ?? "—";
  const leadLabel =
    leadCandidates.find((c) => c.userId === job.jobLeadUserId)?.label ?? null;
  const poc =
    [dash(job.clientPocName), dash(job.clientPocPhone)]
      .filter(Boolean)
      .join(" · ") || null;

  return (
    <ViewEdit
      editLabel="Edit summary"
      view={
        <DetailFields
          rows={[
            { label: "Name", value: job.name },
            { label: "Client", value: companyName },
            {
              label: "Status",
              value: <span className="capitalize">{job.status}</span>,
            },
            { label: "Job window", value: windowLabels.job },
            { label: "Load-in", value: windowLabels.loadIn },
            { label: "Load-out", value: windowLabels.loadOut },
            { label: "Client POC", value: poc },
            { label: "Job lead", value: leadLabel },
            {
              label: "Notes",
              value: dash(job.notes) ? (
                <span className="whitespace-pre-wrap">{job.notes}</span>
              ) : null,
            },
          ]}
        />
      }
      edit={({ onCancel }) => (
        <form
          action={async (formData) => {
            await updateJob(formData);
            onCancel();
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={job.id} />
          <label className="block text-sm text-neutral-600">
            Name
            <input
              name="name"
              required
              defaultValue={job.name}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-neutral-600">
              Client company
              <select
                name="clientCompanyId"
                required
                defaultValue={job.clientCompanyId}
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-neutral-600">
              Status
              <select
                name="status"
                defaultValue={job.status}
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["jobStart", "Job start", windows.jobStart],
                ["jobEnd", "Job end", windows.jobEnd],
                ["loadInStart", "Load-in start", windows.loadInStart],
                ["loadInEnd", "Load-in end", windows.loadInEnd],
                ["loadOutStart", "Load-out start", windows.loadOutStart],
                ["loadOutEnd", "Load-out end", windows.loadOutEnd],
              ] as const
            ).map(([name, label, value]) => (
              <label key={name} className="text-sm text-neutral-600">
                {label}
                <input
                  type="datetime-local"
                  name={name}
                  defaultValue={value}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-neutral-600">
              Client POC name
              <input
                name="clientPocName"
                defaultValue={job.clientPocName ?? ""}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-600">
              Client POC phone
              <input
                name="clientPocPhone"
                defaultValue={job.clientPocPhone ?? ""}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm text-neutral-600">
            Job lead (who to ask)
            <select
              name="jobLeadUserId"
              defaultValue={job.jobLeadUserId ?? ""}
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">None</option>
              {leadCandidates.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-neutral-600">
            Internal notes
            <textarea
              name="notes"
              rows={3}
              defaultValue={job.notes ?? ""}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
            />
          </label>
          <EditFormActions onCancel={onCancel} saveLabel="Save summary" />
        </form>
      )}
    />
  );
}
