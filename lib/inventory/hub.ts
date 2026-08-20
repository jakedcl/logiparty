/** Staff inventory hub query helpers — one page, three tabs, shared location. */

export type InventoryTab = "client" | "equipment" | "fleet";

export const INVENTORY_TABS: readonly {
  id: InventoryTab;
  label: string;
}[] = [
  { id: "client", label: "Client" },
  { id: "equipment", label: "Equipment" },
  { id: "fleet", label: "Fleet" },
] as const;

/** Empty / missing = all locations; `unassigned` = no warehouse. */
export type LocationFilter = string | "unassigned" | "";

export function parseInventoryTab(
  raw: string | undefined,
  allowed: readonly InventoryTab[]
): InventoryTab {
  if (raw === "client" || raw === "equipment" || raw === "fleet") {
    if (allowed.includes(raw)) return raw;
  }
  return allowed[0] ?? "client";
}

export function inventoryHref(opts: {
  tab: InventoryTab;
  location?: string;
  companyId?: string;
}): string {
  const q = new URLSearchParams();
  q.set("tab", opts.tab);
  if (opts.location) q.set("location", opts.location);
  if (opts.companyId) q.set("companyId", opts.companyId);
  return `/dashboard/inventory?${q.toString()}`;
}

/** Parse optional warehouse_id from form — empty string → null. */
export function parseWarehouseId(
  raw: FormDataEntryValue | null
): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  return v;
}
