/** Staff inventory hub — one page, three tabs. */

export type InventoryTab = "client" | "equipment" | "fleet";

export const INVENTORY_TABS: readonly {
  id: InventoryTab;
  label: string;
}[] = [
  { id: "client", label: "Client" },
  { id: "equipment", label: "Equipment" },
  { id: "fleet", label: "Fleet" },
] as const;

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
  companyId?: string;
}): string {
  const q = new URLSearchParams();
  q.set("tab", opts.tab);
  if (opts.companyId) q.set("companyId", opts.companyId);
  return `/dashboard/inventory?${q.toString()}`;
}

/** Prefer `companyId`; accept legacy `clientId` / `client` query aliases. */
export function resolveCompanyIdParam(params: {
  companyId?: string;
  clientId?: string;
  client?: string;
}): string | undefined {
  const raw = params.companyId || params.clientId || params.client;
  return raw?.trim() || undefined;
}
