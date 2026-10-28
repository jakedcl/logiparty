"use client";

import { useRouter } from "next/navigation";

export function ReportsFilters({ from, to }: { from: Date; to: Date }) {
  const router = useRouter();
  const fromValue = from.toISOString().slice(0, 10);
  const toValue = to.toISOString().slice(0, 10);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const f = String(fd.get("from") ?? "");
        const t = String(fd.get("to") ?? "");
        router.push(`/dashboard/reports?from=${f}&to=${t}`);
      }}
    >
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
          From
        </span>
        <input
          type="date"
          name="from"
          defaultValue={fromValue}
          className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
          To
        </span>
        <input
          type="date"
          name="to"
          defaultValue={toValue}
          className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white"
      >
        Apply
      </button>
      <a
        href={`/api/reports/export?from=${fromValue}&to=${toValue}`}
        className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium"
      >
        Export CSV
      </a>
    </form>
  );
}
