"use client";

import { useState, type ReactNode } from "react";
import type { InventoryRequestView } from "@/lib/actions/inventory-requests";
import { PendingInventoryRequestsPanel } from "@/components/client-inventory/pending-requests";

/**
 * Title row: client hero left, quiet “N pending” right.
 * Click opens a panel under the title — closed by default, no details/accordion.
 */
export function ClientInventoryTitleRow({
  title,
  requests,
}: {
  title: ReactNode;
  requests: InventoryRequestView[];
}) {
  const [open, setOpen] = useState(false);
  const count = requests.length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{title}</div>
        {count > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 pt-2 text-sm font-medium tabular-nums text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-2"
          >
            {open ? "Hide pending" : `${count} pending`}
          </button>
        ) : null}
      </div>
      {open && count > 0 ? (
        <div className="border-t border-neutral-200 pt-3">
          <PendingInventoryRequestsPanel requests={requests} />
        </div>
      ) : null}
    </div>
  );
}
