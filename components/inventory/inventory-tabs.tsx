import Link from "next/link";
import {
  INVENTORY_TABS,
  inventoryHref,
  type InventoryTab,
} from "@/lib/inventory/hub";

export function InventoryTabs({
  tab,
  companyId,
  allowed,
}: {
  tab: InventoryTab;
  companyId?: string;
  allowed: readonly InventoryTab[];
}) {
  const tabs = INVENTORY_TABS.filter((t) => allowed.includes(t.id));

  return (
    <nav className="lp-tabs" aria-label="Inventory sections">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <Link
            key={t.id}
            href={inventoryHref({
              tab: t.id,
              companyId: t.id === "client" ? companyId : undefined,
            })}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={active ? "lp-tab lp-tab-active" : "lp-tab"}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
