import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalInventoryRequestForm } from "@/components/portal/inventory-requests";
import { listClientInventoryItems } from "@/lib/actions/client-inventory";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

type RequestType = "add" | "qty_change" | "remove";

function parseType(raw: string | undefined): RequestType | null {
  if (raw === "add" || raw === "qty_change" || raw === "remove") return raw;
  return null;
}

function titleFor(type: RequestType): string {
  switch (type) {
    case "add":
      return "Request new item";
    case "qty_change":
      return "Change quantity";
    case "remove":
      return "Remove from storage";
  }
}

function subtitleFor(type: RequestType): string {
  switch (type) {
    case "add":
      return "Propose a new catalog item. The warehouse team reviews before it appears in your inventory.";
    case "qty_change":
      return "Ask the warehouse to update how many units are on hand for this item.";
    case "remove":
      return "Ask the warehouse to take this item out of storage.";
  }
}

export default async function PortalInventoryRequestNewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; itemId?: string }>;
}) {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const params = await searchParams;
  const type = parseType(params.type);

  if (!type) {
    redirect("/portal/inventory/requests/new?type=add");
  }

  if (!company) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Inventory request</h1>
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
        <Link
          href="/portal/inventory"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Back to inventory
        </Link>
      </div>
    );
  }

  let item = null;
  if (type === "qty_change" || type === "remove") {
    if (!params.itemId) {
      redirect("/portal/inventory");
    }
    const items = await listClientInventoryItems(
      session.user.orgId,
      company.id
    );
    item = items.find((i) => i.id === params.itemId) ?? null;
    if (!item) {
      redirect("/portal/inventory");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          href="/portal/inventory"
          className="text-xs text-neutral-400 hover:text-neutral-700"
        >
          ← Inventory
        </Link>
        <h1 className="text-2xl font-semibold mt-2">{titleFor(type)}</h1>
        <p className="text-sm text-neutral-500 mt-1">{subtitleFor(type)}</p>
      </div>

      <PortalInventoryRequestForm type={type} item={item} />
    </div>
  );
}
