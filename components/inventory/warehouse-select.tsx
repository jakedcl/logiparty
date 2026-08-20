import type { Warehouse } from "@/lib/db/schema";

/** Dense location select for inventory/fleet row forms. */
export function WarehouseSelect({
  warehouses,
  formId,
  name = "warehouseId",
  defaultValue,
  className,
}: {
  warehouses: Warehouse[];
  formId?: string;
  name?: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const active = warehouses.filter((w) => w.isActive);
  const inactive = warehouses.filter(
    (w) => !w.isActive && w.id === defaultValue
  );

  return (
    <select
      form={formId}
      name={name}
      defaultValue={defaultValue ?? ""}
      className={
        className ??
        "w-full max-w-[10rem] border border-transparent hover:border-neutral-200 focus:border-neutral-300 rounded px-1.5 py-1 text-sm bg-transparent focus:bg-white"
      }
      aria-label="Location"
    >
      <option value="">—</option>
      {active.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
      {inactive.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} (inactive)
        </option>
      ))}
    </select>
  );
}
