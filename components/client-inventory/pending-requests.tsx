import {
  approveInventoryRequest,
  denyInventoryRequest,
  type InventoryRequestView,
} from "@/lib/actions/inventory-requests";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

function typeLabel(type: string): string {
  switch (type) {
    case "add":
      return "Add item";
    case "qty_change":
      return "Qty change";
    case "remove":
      return "Remove";
    default:
      return type;
  }
}

function requestDetail(req: InventoryRequestView): string {
  const name = req.itemName ?? req.proposedName ?? "Item";
  const sku = req.itemSku ?? req.proposedSku;
  const parts = [name];
  if (sku) parts.push(sku);
  if (req.type === "qty_change" && req.proposedQuantity != null) {
    parts.push(`qty ${req.itemQty ?? "?"} → ${req.proposedQuantity}`);
  } else if (req.type === "add" && req.proposedQuantity != null) {
    parts.push(`qty ${req.proposedQuantity}`);
  }
  return parts.join(" · ");
}

export function PendingInventoryRequestsPanel({
  requests,
}: {
  requests: InventoryRequestView[];
}) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-2">
        No pending inventory requests.
      </p>
    );
  }

  return (
    <div className="lp-table-wrap">
      <table className="lp-table min-w-[560px]">
        <thead>
          <tr>
            <th className="py-2 px-3 font-medium w-[6.5rem]">Type</th>
            <th className="py-2 px-3 font-medium">Request</th>
            <th className="py-2 px-3 font-medium">Reason</th>
            <th className="py-2 px-3 font-medium w-[12rem] text-right">
              {" "}
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr
              key={req.id}
              className="border-b border-neutral-100 last:border-0 align-top hover:bg-neutral-50/80"
            >
              <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                {typeLabel(req.type)}
              </td>
              <td className="py-2 px-3">
                <p className="font-medium text-neutral-900">
                  {requestDetail(req)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {req.requesterLabel}
                  {req.clientName ? ` · ${req.clientName}` : ""}
                </p>
              </td>
              <td className="py-2 px-3 text-neutral-600">
                <p className="line-clamp-2">{req.reason}</p>
              </td>
              <td className="py-2 px-3 text-right">
                <div className="inline-flex flex-col items-end gap-2">
                  <form action={approveInventoryRequest}>
                    <input type="hidden" name="id" value={req.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-neutral-900 hover:underline"
                    >
                      Approve
                    </button>
                  </form>
                  <form
                    action={denyInventoryRequest}
                    className="flex flex-col items-end gap-1"
                  >
                    <input type="hidden" name="id" value={req.id} />
                    <input
                      name="reviewNote"
                      placeholder="Optional note"
                      className="w-36 border border-neutral-200 rounded px-1.5 py-1 text-xs text-left"
                    />
                    <ConfirmSubmitButton
                      message="Deny this inventory request? The client will see it as denied."
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Deny
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
