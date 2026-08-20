import { redirect } from "next/navigation";
import { inventoryHref } from "@/lib/inventory/hub";

/** Legacy URL → Inventory hub Fleet tab. */
export default function FleetRedirect() {
  redirect(inventoryHref({ tab: "fleet" }));
}
