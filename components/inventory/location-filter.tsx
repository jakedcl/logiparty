import Link from "next/link";
import type { Warehouse } from "@/lib/db/schema";
import { inventoryHref, type InventoryTab } from "@/lib/inventory/hub";

export function InventoryLocationFilter({
  warehouses,
  tab,
  location,
  companyId,
}: {
  warehouses: Warehouse[];
  tab: InventoryTab;
  location?: string;
  companyId?: string;
}) {
  const active = warehouses.filter((w) => w.isActive);
  const inactive = warehouses.filter((w) => !w.isActive);

  function chipClass(selected: boolean) {
    return `shrink-0 border-b-2 px-2.5 py-1.5 text-sm transition-colors ${
      selected
        ? "border-[var(--primary)] font-medium text-neutral-900"
        : "border-transparent text-neutral-500 hover:text-neutral-800"
    }`;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-neutral-100 pb-1">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Location
      </span>
      <Link
        href={inventoryHref({
          tab,
          companyId: tab === "client" ? companyId : undefined,
        })}
        scroll={false}
        className={chipClass(!location)}
      >
        All
      </Link>
      {active.map((w) => (
        <Link
          key={w.id}
          href={inventoryHref({
            tab,
            location: w.id,
            companyId: tab === "client" ? companyId : undefined,
          })}
          scroll={false}
          className={chipClass(location === w.id)}
        >
          {w.name}
        </Link>
      ))}
      <Link
        href={inventoryHref({
          tab,
          location: "unassigned",
          companyId: tab === "client" ? companyId : undefined,
        })}
        scroll={false}
        className={chipClass(location === "unassigned")}
      >
        Unassigned
      </Link>
      {inactive.length > 0
        ? inactive.map((w) => (
            <Link
              key={w.id}
              href={inventoryHref({
                tab,
                location: w.id,
                companyId: tab === "client" ? companyId : undefined,
              })}
              scroll={false}
              className={`${chipClass(location === w.id)} opacity-60`}
              title="Inactive"
            >
              {w.name}
            </Link>
          ))
        : null}
    </div>
  );
}
