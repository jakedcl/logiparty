import type { ReactNode } from "react";

/** A6/A7-style collapsed create form — list first, add on demand. */
export function CollapsibleAdd({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-t border-neutral-100 pt-3">
      <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-neutral-400 group-open:hidden" aria-hidden>
            +
          </span>
          <span className="hidden text-neutral-400 group-open:inline" aria-hidden>
            −
          </span>
          {label}
        </span>
      </summary>
      <div className="mt-3 max-w-lg">{children}</div>
    </details>
  );
}
