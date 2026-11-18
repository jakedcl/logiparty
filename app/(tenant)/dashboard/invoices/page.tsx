import Link from "next/link";
import { redirect } from "next/navigation";
import { listInvoices } from "@/lib/actions/invoices";
import { canManageCommercial } from "@/lib/auth/permissions";
import { formatCents } from "@/lib/commercial/money";
import { requireSession } from "@/lib/org/context";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function InvoicesPage() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) redirect("/dashboard");

  const rows = await listInvoices(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Invoices</h1>
        <p className="text-sm text-neutral-500">
          Bill jobs after the work — create from a job detail page.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No invoices yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500 border-b">
              <th className="text-left py-2">Number</th>
              <th className="text-left py-2">Client</th>
              <th className="text-left py-2">Status</th>
              <th className="text-right py-2">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id} className="border-b border-[var(--border-subtle)]">
                <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                <td className="py-2">{inv.clientName}</td>
                <td className="py-2">
                  <StatusBadge status={inv.status} kind="invoice" />
                </td>
                <td className="py-2 text-right">
                  {formatCents(inv.totalCents)}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/dashboard/invoices/${inv.id}`}
                    className="lp-link-quiet"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
