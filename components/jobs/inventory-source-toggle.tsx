"use client";

import { useRouter } from "next/navigation";
import { SegmentedControl } from "@/components/marketing/segmented-control";

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
    <SegmentedControl
      ariaLabel="Inventory source"
      value={source}
      onChange={(id) => go(id === "org" ? "org" : "client")}
      segments={[
        { id: "client", label: "Client items" },
        { id: "org", label: "Our items" },
      ]}
    />
  );
}
