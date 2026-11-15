import { cn } from "@/lib/utils";

/** Vertical workspace navigation; selection follows the tenant brand. */
export function navPillClass(active: boolean, nested = false) {
  return cn(
    "rounded-md border border-transparent text-sm font-medium",
    nested ? "px-3 py-1.5" : "px-3 py-2",
    active
      ? "app-nav-active"
      : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
  );
}
