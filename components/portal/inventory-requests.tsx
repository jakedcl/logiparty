"use client";

import Link from "next/link";
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

function ItemActionsMenu({ itemId }: { itemId: string }) {
  return (
    <details className="relative inline-block text-left">
      <summary
        className="list-none cursor-pointer select-none rounded px-1.5 py-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 [&::-webkit-details-marker]:hidden"
        aria-label="More actions"
      >
        <span aria-hidden className="text-base leading-none tracking-tighter">
          ⋯
        </span>
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] rounded-md border border-neutral-200 bg-white py-1 shadow-sm">
        <Link
          href={`/portal/inventory/requests/new?type=qty_change&itemId=${itemId}`}
          className="block px-2.5 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50"
        >
          Change quantity
        </Link>
        <Link
          href={`/portal/inventory/requests/new?type=remove&itemId=${itemId}`}
          className="block px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Remove from storage
        </Link>
      </div>
    </details>
  );
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
    <div className="lp-table-wrap">
      <table className="lp-table min-w-[420px]">
        <thead>
          <tr>
            <th className="py-2 px-3 font-medium">SKU</th>
            <th className="py-2 px-3 font-medium">Name</th>
            <th className="py-2 px-3 font-medium w-[4.5rem]">Qty</th>
            <th className="py-2 px-3 font-medium w-[3.5rem] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className=""
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
                <ItemActionsMenu itemId={item.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortalRequestNewItemLink() {
  return (
    <div className="border-t border-neutral-200 pt-4">
      <Link
        href="/portal/inventory/requests/new?type=add"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <span className="text-neutral-400" aria-hidden>
          +
        </span>
        Request new item
      </Link>
    </div>
  );
}

const fieldClass =
  "mt-1 w-full border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white";
const labelClass = "block text-xs font-medium text-neutral-500";
const readonlyClass =
  "mt-1 text-sm text-neutral-900 border border-transparent rounded-md px-0 py-1";

export function PortalInventoryRequestForm({
  type,
  item,
}: {
  type: "add" | "qty_change" | "remove";
  item?: Pick<
    ClientInventoryItem,
    "id" | "sku" | "name" | "totalQuantity" | "description"
  > | null;
}) {
  if (type === "add") {
    return (
      <form action={requestInventoryAdd} className="space-y-5 max-w-lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            SKU
            <input
              name="sku"
              required
              placeholder="RB-NEW-01"
              className={`${fieldClass} font-mono`}
            />
          </label>
          <label className={labelClass}>
            Quantity
            <input
              name="quantity"
              type="number"
              min={0}
              required
              defaultValue={1}
              className={fieldClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Name
          <input
            name="name"
            required
            placeholder="Item name"
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Description
          <input
            name="description"
            placeholder="Optional"
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Reason
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="Why add this item?"
            className={fieldClass}
          />
        </label>
        <FormActions />
      </form>
    );
  }

  if (!item) {
    return (
      <p className="text-sm text-neutral-500">
        Item not found.{" "}
        <Link href="/portal/inventory" className="underline">
          Back to inventory
        </Link>
      </p>
    );
  }

  if (type === "qty_change") {
    return (
      <form action={requestInventoryQtyChange} className="space-y-5 max-w-lg">
        <input type="hidden" name="itemId" value={item.id} />
        <ItemReadonlyFields item={item} />
        <label className={labelClass}>
          New quantity
          <input
            name="quantity"
            type="number"
            min={0}
            required
            defaultValue={item.totalQuantity}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Reason
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="Why change the quantity?"
            className={fieldClass}
          />
        </label>
        <FormActions />
      </form>
    );
  }

  return (
    <form action={requestInventoryRemove} className="space-y-5 max-w-lg">
      <input type="hidden" name="itemId" value={item.id} />
      <ItemReadonlyFields item={item} />
      <p className="text-sm text-neutral-600 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        This asks the warehouse to remove{" "}
        <span className="font-medium text-neutral-900">{item.name}</span> from
        storage. Nothing changes until they approve.
      </p>
      <label className={labelClass}>
        Reason
        <textarea
          name="reason"
          required
          rows={3}
          placeholder="Why remove this item?"
          className={fieldClass}
        />
      </label>
      <FormActions submitLabel="Submit remove request" danger />
    </form>
  );
}

function ItemReadonlyFields({
  item,
}: {
  item: Pick<
    ClientInventoryItem,
    "sku" | "name" | "totalQuantity" | "description"
  >;
}) {
  return (
    <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div>
        <p className={labelClass}>Name</p>
        <p className={readonlyClass}>{item.name}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className={labelClass}>SKU</p>
          <p className={`${readonlyClass} font-mono text-xs`}>{item.sku}</p>
        </div>
        <div>
          <p className={labelClass}>Current quantity</p>
          <p className={`${readonlyClass} tabular-nums`}>
            {item.totalQuantity}
          </p>
        </div>
      </div>
      {item.description ? (
        <div>
          <p className={labelClass}>Description</p>
          <p className={`${readonlyClass} text-neutral-600`}>
            {item.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FormActions({
  submitLabel = "Submit request",
  danger = false,
}: {
  submitLabel?: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <button
        type="submit"
        className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
          danger
            ? "bg-red-600 hover:bg-red-700"
            : "bg-neutral-900 hover:bg-neutral-800"
        }`}
      >
        {submitLabel}
      </button>
      <Link
        href="/portal/inventory"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        Cancel
      </Link>
    </div>
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
    <div className="lp-table-wrap">
      <table className="lp-table min-w-[480px]">
        <thead>
          <tr>
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
