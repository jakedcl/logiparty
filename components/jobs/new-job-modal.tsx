"use client";

import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/actions/jobs";
import { JOB_STATUSES } from "@/lib/db/schema";

type Props = {
  companies: { id: string; name: string }[];
  leadCandidates: { userId: string; label: string }[];
  /** Open on load (dashboard + New job → `?new=1`). */
  defaultOpen?: boolean;
};

export function NewJobModal({
  companies,
  leadCandidates,
  defaultOpen = false,
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  function stripNewQuery() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    url.hash = "";
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    if (defaultOpen) dialogRef.current?.showModal();
  }, [defaultOpen]);

  return (
    <>
      <button type="button" onClick={open} className="lp-btn">
        + New job
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 open:flex open:items-center open:justify-center [&::backdrop]:bg-neutral-900/45"
        onClose={stripNewQuery}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border border-neutral-200 bg-white p-6 shadow-xl sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="text-base font-semibold text-neutral-900"
            >
              New job
            </h2>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Close
            </button>
          </div>

          <form action={createJob} className="space-y-3">
            <label className="app-label">
              Job name
              <input
                name="name"
                required
                placeholder="Job name"
                autoFocus
                className="app-input mt-1"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="app-label">
                Client company
                <select
                  name="clientCompanyId"
                  required
                  className="app-input mt-1"
                >
                  <option value="">Select…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-label">
                Status
                <select
                  name="status"
                  defaultValue="upcoming"
                  className="app-input mt-1"
                >
                  {JOB_STATUSES.filter((s) => s !== "denied").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["jobStart", "Job start"],
                  ["jobEnd", "Job end"],
                  ["loadInStart", "Load-in start"],
                  ["loadInEnd", "Load-in end"],
                  ["loadOutStart", "Load-out start"],
                  ["loadOutEnd", "Load-out end"],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="app-label">
                  {label}
                  <input
                    type="datetime-local"
                    name={name}
                    className="app-input mt-1"
                  />
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="app-label">
                Client POC name
                <input
                  name="clientPocName"
                  placeholder="Name"
                  className="app-input mt-1"
                />
              </label>
              <label className="app-label">
                Client POC phone
                <input
                  name="clientPocPhone"
                  type="tel"
                  placeholder="Phone"
                  className="app-input mt-1"
                />
              </label>
            </div>
            <label className="app-label">
              Job lead (who to ask)
              <select name="jobLeadUserId" className="app-input mt-1">
                <option value="">None</option>
                {leadCandidates.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="app-label">
              Internal notes
              <textarea
                name="notes"
                rows={3}
                placeholder="Notes"
                className="app-input mt-1"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="submit" className="app-btn app-btn-primary">
                Create job
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
