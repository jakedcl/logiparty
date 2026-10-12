import { cn } from "@/lib/utils";

/** Vertical nav item. Active state is the shared aqua pill. */
export function navPillClass(active: boolean, nested = false) {
  return cn(
    "rounded-full border border-transparent text-sm",
    nested ? "px-3 py-1.5" : "px-3 py-2",
    active
      ? "app-nav-active"
      : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
  );
}
