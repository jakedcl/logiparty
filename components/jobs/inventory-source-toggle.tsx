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
    const q = new URLSearchParams();
    if (next === "org") q.set("inv", "org");
    const qs = q.toString();
    router.push(`/dashboard/jobs/${jobId}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="lp-tabs" role="group" aria-label="Inventory source">
      <button
        type="button"
        className={source === "client" ? "lp-tab lp-tab-active" : "lp-tab"}
        aria-pressed={source === "client"}
        onClick={() => go("client")}
      >
        Client items
      </button>
      <button
        type="button"
        className={source === "org" ? "lp-tab lp-tab-active" : "lp-tab"}
        aria-pressed={source === "org"}
        onClick={() => go("org")}
      >
        Our items
      </button>
    </div>
  );
}
