"use client";

import { useState, type ReactNode } from "react";
import type { InventoryRequestView } from "@/lib/actions/inventory-requests";
import { PendingInventoryRequestsPanel } from "@/components/client-inventory/pending-requests";

/**
 * Title row chrome: left slot (client switcher) + quiet pending control on the right.
 * When open, pending list expands full-width under the title — not competing with Add.
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
        {count === 0 ? (
          <p className="shrink-0 pt-2 text-sm text-[var(--faint)]">
            No pending requests
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-[var(--foreground)] hover:underline underline-offset-2"
          >
            <span className="tabular-nums">
              {count} pending request{count === 1 ? "" : "s"}
            </span>
            <span
              aria-hidden
              className={`text-xs text-[var(--subtle)] transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>
        )}
      </div>
      {open && count > 0 ? (
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <PendingInventoryRequestsPanel requests={requests} />
        </div>
      ) : null}
    </div>
  );
}
