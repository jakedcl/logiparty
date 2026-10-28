import { notFound, redirect } from "next/navigation";
import {
  addInvoiceLine,
  getInvoiceDetail,
  getInvoicePdfUrl,
  recordManualPayment,
  sendInvoice,
} from "@/lib/actions/invoices";
import { canManageCommercial } from "@/lib/auth/permissions";
import { formatCents } from "@/lib/commercial/money";
import { isStripeConfigured } from "@/lib/stripe";
import { requireSession } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  if (!canManageCommercial(session.user)) redirect("/dashboard");
  const orgId = session.user.orgId;

  const { invoice, lines } = await getInvoiceDetail(orgId, id);
  if (!invoice) notFound();

  const pdfUrl = await getInvoicePdfUrl(orgId, id).catch(() => null);
  const draft = invoice.status === "draft";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-neutral-500">
          {invoice.invoiceNumber}
        </p>
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <StatusBadge status={invoice.status} kind="invoice" />
      </div>

      <div className="flex flex-wrap gap-2">
        {draft && (
          <form action={sendInvoice.bind(null, orgId, id)}>
            <Button type="submit">Send invoice</Button>
          </form>
        )}
        {pdfUrl && (
          <a href={pdfUrl} className="lp-link-quiet text-sm" target="_blank" rel="noreferrer">
            PDF
          </a>
        )}
        {invoice.stripePaymentLinkUrl && (
          <a
            href={invoice.stripePaymentLinkUrl}
            className="lp-link-quiet text-sm"
            target="_blank"
            rel="noreferrer"
          >
            Payment link
          </a>
        )}
        {!isStripeConfigured() && !draft && (
          <span className="text-xs text-neutral-500">
            Online pay not configured — record payment manually.
          </span>
        )}
      </div>

      <table className="w-full text-sm">
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="py-2">{line.description}</td>
              <td className="py-2 text-right">
                {formatCents(line.lineTotalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm font-medium text-right">
        Total {formatCents(invoice.totalCents)} · Paid{" "}
        {formatCents(invoice.amountPaidCents)}
      </p>

      {draft && (
        <details className="lp-collapse">
          <summary className="cursor-pointer text-sm font-medium">
            + Damage / loss / adjustment
          </summary>
          <form
            action={addInvoiceLine.bind(null, orgId, id)}
            className="mt-3 space-y-2 max-w-md"
          >
            <input type="hidden" name="kind" value="damage_loss" />
            <input
              name="description"
              required
              placeholder="Description"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="quantity"
              type="number"
              defaultValue="1"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="unitPrice"
              placeholder="Amount ($)"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <Button type="submit">Add line</Button>
          </form>
        </details>
      )}

      {invoice.status === "sent" && (
        <form
          action={recordManualPayment.bind(null, orgId, id)}
          className="flex gap-2 items-end max-w-sm"
        >
          <label className="text-sm flex-1">
            Record payment ($)
            <input
              name="amount"
              defaultValue={(invoice.totalCents / 100).toFixed(2)}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" variant="secondary">
            Mark paid
          </Button>
        </form>
      )}
    </div>
  );
}
