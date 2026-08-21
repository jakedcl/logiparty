"use client";

import { RowActionsMenu } from "@/components/ui/row-actions-menu";

/**
 * Destructive action tucked behind a ⋯ control so list rows stay dense.
 * Portals the menu to the document body so table overflow cannot clip it.
 */
export function QuietRemove({
  children,
  label = "Remove",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <RowActionsMenu label="More actions">
      <div className="px-0 [&_button]:block [&_button]:w-full [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-left [&_button]:text-sm [&_button]:text-red-600 [&_button]:hover:bg-red-50">
        {children}
      </div>
      <p className="sr-only">{label}</p>
    </RowActionsMenu>
  );
}
