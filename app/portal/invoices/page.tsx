import { redirect } from "next/navigation";
import { listPortalInvoices } from "@/lib/actions/invoices";
import { formatCents } from "@/lib/commercial/money";
import { requireSession } from "@/lib/org/context";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function PortalInvoicesPage() {
  const session = await requireSession();
  if (!session.user.isClient) redirect("/portal");

  const rows = await listPortalInvoices(session.user.orgId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No invoices yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {rows.map((inv) => (
            <li key={inv.id} className="py-3 flex justify-between gap-2">
              <div>
                <p className="font-mono text-xs">{inv.invoiceNumber}</p>
                <p className="text-sm">{formatCents(inv.totalCents)}</p>
              </div>
              <div className="text-right space-y-1">
                <StatusBadge status={inv.status} />
                {inv.stripePaymentLinkUrl && (
                  <a
                    href={inv.stripePaymentLinkUrl}
                    className="block text-sm lp-link-quiet"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pay now
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
