"use client";

import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  source: "client" | "org";
};

/** Switch inventory picker between job client catalog (default) and our inventory. */
export function InventorySourceToggle({ jobId, source }: Props) {
  const router = useRouter();

  return (
    <div className="flex gap-2 text-sm">
      <button
        type="button"
        className={`rounded-full border px-3 py-1 ${
          source === "client"
            ? "bg-neutral-900 text-white border-neutral-900"
            : "text-neutral-600"
        }`}
        onClick={() => router.push(`/dashboard/jobs/${jobId}?inv=client#inventory`)}
      >
        Client items
      </button>
      <button
        type="button"
        className={`rounded-full border px-3 py-1 ${
          source === "org"
            ? "bg-neutral-900 text-white border-neutral-900"
            : "text-neutral-600"
        }`}
        onClick={() => router.push(`/dashboard/jobs/${jobId}?inv=org#inventory`)}
      >
        Our items
      </button>
    </div>
  );
}
