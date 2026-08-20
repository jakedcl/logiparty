import { redirect } from "next/navigation";
import { inventoryHref } from "@/lib/inventory/hub";

/** Legacy URL → Inventory hub Client tab. */
export default async function ClientInventoryRedirect({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  redirect(
    inventoryHref({
      tab: "client",
      companyId: companyId || undefined,
    })
  );
}
