"use client";

import { useState, type ReactNode } from "react";

type ViewEditProps = {
  /** Read-only content shown by default */
  view: ReactNode;
  /** Edit form; call onCancel to leave edit mode without saving */
  edit: (ctx: { onCancel: () => void }) => ReactNode;
  editLabel?: string;
  /** Optional class on the outer wrapper */
  className?: string;
  /**
   * `block` — Edit button above content (summary panels).
   * `inline` — Edit as a quiet text control beside content (dense list rows).
   */
  variant?: "block" | "inline";
};

/**
 * Detail views default to labeled read-only values.
 * Click Edit → form with Save / Cancel. Same idea as A6/A7 create-last lists.
 */
export function ViewEdit({
  view,
  edit,
  editLabel = "Edit",
  className,
  variant = "block",
}: ViewEditProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className={className}>
        {edit({ onCancel: () => setEditing(false) })}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={className}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{view}</div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-900 pt-0.5"
          >
            {editLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded px-2.5 py-1 text-sm font-medium text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
        >
          {editLabel}
        </button>
      </div>
      {view}
    </div>
  );
}

/** Dense label → value rows for read-only detail views */
export function DetailFields({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-[7.5rem_1fr] text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-neutral-500 sm:pt-0.5">{row.label}</dt>
          <dd className="text-neutral-900 min-w-0 break-words">
            {row.value ?? (
              <span className="text-neutral-400">—</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EditFormActions({
  onCancel,
  saveLabel = "Save",
}: {
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="submit"
        className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
      >
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded px-3 py-2 text-sm text-neutral-600 border border-neutral-300 hover:bg-neutral-50"
      >
        Cancel
      </button>
    </div>
  );
}
