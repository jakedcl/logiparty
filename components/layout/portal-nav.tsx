"use client";

import { usePathname } from "next/navigation";
import { SegmentedControl } from "@/components/marketing/segmented-control";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "home", href: "/portal", label: "Home" },
  { id: "jobs", href: "/portal/jobs", label: "Jobs" },
  { id: "inventory", href: "/portal/inventory", label: "Inventory" },
  { id: "notes", href: "/portal/notes", label: "Notes" },
] as const;

/** Same capsule as the landing product demo (Jobs / Inventory / Portal / Staff). */
export function PortalNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const value = pathname.startsWith("/portal/jobs")
    ? "jobs"
    : pathname.startsWith("/portal/inventory")
      ? "inventory"
      : pathname.startsWith("/portal/notes")
        ? "notes"
        : "home";

  return (
    <SegmentedControl
      className={cn("m-seg-wrap-wide", className)}
      segments={NAV.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
      }))}
      value={value}
      ariaLabel="Portal"
    />
  );
}
