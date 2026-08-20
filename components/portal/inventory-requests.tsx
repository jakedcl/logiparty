"use client";

import {
  requestInventoryAdd,
  requestInventoryQtyChange,
  requestInventoryRemove,
} from "@/lib/actions/inventory-requests";
import type { ClientInventoryItem } from "@/lib/db/schema";

function statusClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "denied":
      return "bg-red-100 text-red-900";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

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

export function PortalInventoryItemsTable({
  items,
}: {
  items: ClientInventoryItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No inventory listed yet. Use + Request new item below if you need
        something added.
      </p>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[420px] text-sm text-left">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
            <th className="py-2 px-3 font-medium">SKU</th>
            <th className="py-2 px-3 font-medium">Name</th>
            <th className="py-2 px-3 font-medium w-[4.5rem]">Qty</th>
            <th className="py-2 px-3 font-medium w-[9rem] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-neutral-100 last:border-0 align-top hover:bg-neutral-50/80"
            >
              <td className="py-2 px-3 font-mono text-xs text-neutral-700 whitespace-nowrap">
                {item.sku}
              </td>
              <td className="py-2 px-3 text-neutral-900">
                {item.name}
                {item.description ? (
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                ) : null}
              </td>
              <td className="py-2 px-3 tabular-nums text-neutral-700">
                {item.totalQuantity}
              </td>
              <td className="py-2 px-3 text-right">
                <details className="group relative inline-block text-left">
                  <summary className="cursor-pointer list-none text-xs font-medium text-neutral-600 hover:text-neutral-900 [&::-webkit-details-marker]:hidden">
                    Request ▾
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 w-[16rem] rounded-md border border-neutral-200 bg-white p-3 shadow-sm space-y-3">
                    <form
                      action={requestInventoryQtyChange}
                      className="space-y-2"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <p className="text-xs font-medium text-neutral-800">
                        Qty change
                      </p>
                      <label className="block text-xs text-neutral-500">
                        New quantity
                        <input
                          name="quantity"
                          type="number"
                          min={0}
                          required
                          defaultValue={item.totalQuantity}
                          className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block text-xs text-neutral-500">
                        Reason
                        <textarea
                          name="reason"
                          required
                          rows={2}
                          placeholder="Why change qty?"
                          className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                        />
                      </label>
                      <button
                        type="submit"
                        className="text-xs font-medium text-neutral-900 hover:underline"
                      >
                        Submit qty request
                      </button>
                    </form>
                    <div className="border-t border-neutral-100 pt-2">
                      <form
                        action={requestInventoryRemove}
                        className="space-y-2"
                      >
                        <input type="hidden" name="itemId" value={item.id} />
                        <p className="text-xs font-medium text-neutral-800">
                          Remove from storage
                        </p>
                        <label className="block text-xs text-neutral-500">
                          Reason
                          <textarea
                            name="reason"
                            required
                            rows={2}
                            placeholder="Why remove?"
                            className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Submit remove request
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortalRequestNewItem() {
  return (
    <details className="group border-t border-neutral-200 pt-4">
      <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-neutral-400 group-open:hidden" aria-hidden>
            +
          </span>
          <span
            className="hidden text-neutral-400 group-open:inline"
            aria-hidden
          >
            −
          </span>
          Request new item
        </span>
      </summary>
      <div className="mt-3 max-w-xl space-y-3">
        <p className="text-xs text-neutral-500">
          Submits a request for warehouse review. The catalog updates after
          approval.
        </p>
        <form action={requestInventoryAdd} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-neutral-500">
              SKU
              <input
                name="sku"
                required
                placeholder="RB-NEW-01"
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm font-mono"
              />
            </label>
            <label className="text-xs text-neutral-500">
              Quantity
              <input
                name="quantity"
                type="number"
                min={0}
                required
                defaultValue={1}
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs text-neutral-500">
            Name
            <input
              name="name"
              required
              placeholder="Item name"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-neutral-500">
            Description
            <input
              name="description"
              placeholder="Optional"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-neutral-500">
            Reason
            <textarea
              name="reason"
              required
              rows={2}
              placeholder="Why add this item?"
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
          >
            Submit request
          </button>
        </form>
      </div>
    </details>
  );
}

export function PortalInventoryRequestsList({
  requests,
}: {
  requests: {
    id: string;
    type: string;
    status: string;
    reason: string;
    proposedSku: string | null;
    proposedName: string | null;
    proposedQuantity: number | null;
    itemSku: string | null;
    itemName: string | null;
    reviewNote: string | null;
    createdAt: Date;
  }[];
}) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-2">No requests yet.</p>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[480px] text-sm text-left">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
            <th className="py-2 px-3 font-medium w-[7rem]">Type</th>
            <th className="py-2 px-3 font-medium">Item</th>
            <th className="py-2 px-3 font-medium">Reason</th>
            <th className="py-2 px-3 font-medium w-[6.5rem]">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const label =
              req.itemName ??
              req.proposedName ??
              req.itemSku ??
              req.proposedSku ??
              "Item";
            const sku = req.itemSku ?? req.proposedSku;
            return (
              <tr
                key={req.id}
                className="border-b border-neutral-100 last:border-0 align-top"
              >
                <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                  {typeLabel(req.type)}
                </td>
                <td className="py-2 px-3">
                  <span className="font-medium text-neutral-900">{label}</span>
                  {sku ? (
                    <span className="ml-1.5 font-mono text-xs text-neutral-500">
                      {sku}
                    </span>
                  ) : null}
                  {req.type !== "remove" && req.proposedQuantity != null ? (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Qty → {req.proposedQuantity}
                    </p>
                  ) : null}
                </td>
                <td className="py-2 px-3 text-neutral-600">
                  <p className="line-clamp-2">{req.reason}</p>
                  {req.reviewNote ? (
                    <p className="text-xs text-neutral-400 mt-1">
                      Note: {req.reviewNote}
                    </p>
                  ) : null}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${statusClass(req.status)}`}
                  >
                    {req.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
