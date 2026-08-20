import Link from "next/link";
import {
  INVENTORY_TABS,
  inventoryHref,
  type InventoryTab,
} from "@/lib/inventory/hub";

export function InventoryTabs({
  tab,
  location,
  companyId,
  allowed,
}: {
  tab: InventoryTab;
  location?: string;
  companyId?: string;
  allowed: readonly InventoryTab[];
}) {
  const tabs = INVENTORY_TABS.filter((t) => allowed.includes(t.id));

  return (
    <nav
      className="flex gap-0 overflow-x-auto border-b border-neutral-200 -mx-1 px-1"
      aria-label="Inventory sections"
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <Link
            key={t.id}
            href={inventoryHref({
              tab: t.id,
              location: location || undefined,
              companyId: t.id === "client" ? companyId : undefined,
            })}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 px-3 py-2.5 text-sm transition-colors ${
              active
                ? "font-medium text-neutral-900"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 bg-[var(--primary)]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
