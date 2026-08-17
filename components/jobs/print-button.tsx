"use client";

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        "rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white no-print"
      }
    >
      Print run sheet
    </button>
  );
}
