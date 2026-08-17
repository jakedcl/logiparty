import { listClientInventoryItems } from "@/lib/actions/client-inventory";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

export default async function PortalInventoryPage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const items =
    company ?
      await listClientInventoryItems(session.user.orgId, company.id)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Items stored with us for {company?.name ?? "your company"}.
        </p>
      </div>

      {!company && (
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
      )}
      {company && items.length === 0 && (
        <p className="text-sm text-neutral-500">No inventory listed yet.</p>
      )}
      {items.length > 0 && (
        <div className="border rounded-lg bg-white overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[280px] text-sm text-left">
            <thead>
              <tr className="border-b text-neutral-500 bg-neutral-50">
                <th className="py-2 px-3 font-medium">SKU</th>
                <th className="py-2 px-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 px-3">{item.sku}</td>
                  <td className="py-2 px-3">{item.name}</td>
                  <td className="py-2 px-3">{item.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
