import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createRateCardLine,
  deleteRateCardLine,
  listRateCardCatalogOptions,
  listRateCardLines,
} from "@/lib/actions/rate-cards";
import {
  canManageCommercial,
  canManageCommercialSettings,
} from "@/lib/auth/permissions";
import { formatCents } from "@/lib/commercial/money";
import { requireSession } from "@/lib/org/context";
import { Button } from "@/components/ui/button";

export default async function CommercialSettingsPage() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) redirect("/dashboard");
  const orgId = session.user.orgId;
  const lines = await listRateCardLines(orgId);
  const { equipment, fleet } = await listRateCardCatalogOptions(orgId);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/dashboard/settings" className="lp-link-quiet text-sm">
          ← Settings
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Pricing & rate cards</h1>
        <p className="text-sm text-neutral-500">
          Default rates for equipment, labor, and fleet on quotes.
        </p>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-neutral-500">No rate lines yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)] text-sm">
          {lines.map((line) => (
            <li key={line.id} className="py-2 flex justify-between gap-2">
              <span>
                {line.description}{" "}
                <span className="text-neutral-500">
                  · {line.kind} · {formatCents(line.unitPriceCents)}
                </span>
              </span>
              <form action={deleteRateCardLine.bind(null, orgId, line.id)}>
                <button type="submit" className="text-xs text-red-600">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <details className="lp-collapse">
        <summary className="cursor-pointer text-sm font-medium">
          + Add rate line
        </summary>
        <form
          action={createRateCardLine.bind(null, orgId)}
          className="mt-3 space-y-3"
        >
          <label className="block text-sm">
            Kind
            <select name="kind" className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
              <option value="equipment">Equipment</option>
              <option value="labor">Labor</option>
              <option value="fleet">Fleet</option>
              <option value="fee">Fee</option>
            </select>
          </label>
          <label className="block text-sm">
            Description
            <input
              name="description"
              required
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Unit price ($)
            <input
              name="unitPrice"
              defaultValue="0"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Equipment SKU (optional)
            <select name="inventoryItemId" className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
              <option value="">—</option>
              {equipment.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sku} — {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Fleet vehicle (optional)
            <select name="fleetVehicleId" className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
              <option value="">—</option>
              {fleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Save rate</Button>
        </form>
      </details>

      {canManageCommercialSettings(session.user) && (
        <p className="text-xs text-neutral-500">
          Tax rate and numbering: org admin fields ship in a follow-up — defaults
          apply (0% tax until set in database).
        </p>
      )}
    </div>
  );
}
