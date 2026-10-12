import { SegmentedControl } from "@/components/marketing/segmented-control";
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
    <SegmentedControl
      ariaLabel="Inventory sections"
      value={tab}
      segments={tabs.map((t) => ({
        id: t.id,
        label: t.label,
        scroll: false,
        href: inventoryHref({
          tab: t.id,
          companyId: t.id === "client" ? companyId : undefined,
        }),
      }))}
    />
  );
}
