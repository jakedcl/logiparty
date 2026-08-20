"use client";

import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  source: "client" | "org";
};

/** Switch inventory picker between job client catalog (default) and our inventory. */
export function InventorySourceToggle({ jobId, source }: Props) {
  const router = useRouter();

  function go(next: "client" | "org") {
    const q = new URLSearchParams({ tab: "inventory", inv: next });
    router.push(`/dashboard/jobs/${jobId}?${q.toString()}`);
  }

  return (
    <div className="inline-flex rounded-md border border-neutral-200 p-0.5 text-sm bg-neutral-50">
      <button
        type="button"
        className={`rounded px-3 py-1 transition-colors ${
          source === "client"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        onClick={() => go("client")}
      >
        Client items
      </button>
      <button
        type="button"
        className={`rounded px-3 py-1 transition-colors ${
          source === "org"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        onClick={() => go("org")}
      >
        Our items
      </button>
    </div>
  );
}
