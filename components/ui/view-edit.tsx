"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
            className="lp-link-quiet shrink-0 pt-0.5 font-bold"
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
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          {editLabel}
        </Button>
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
          <dt className="text-[var(--muted)] sm:pt-0.5">{row.label}</dt>
          <dd className="min-w-0 break-words text-[var(--foreground)]">
            {row.value ?? (
              <span className="text-[var(--faint)]">—</span>
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
      <Button type="submit">{saveLabel}</Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
