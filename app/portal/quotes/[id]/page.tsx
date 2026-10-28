import { notFound, redirect } from "next/navigation";
import {
  getQuoteDetail,
  getQuotePdfUrl,
  respondToQuote,
} from "@/lib/actions/quotes";
import { formatCents } from "@/lib/commercial/money";
import { requireSession } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = { params: Promise<{ id: string }> };

export default async function PortalQuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  if (!session.user.isClient) redirect("/portal");

  const orgId = session.user.orgId;
  const detail = await getQuoteDetail(orgId, id, true);
  if (!detail) notFound();

  const { quote, lines, response } = detail;
  const canRespond = quote.status === "sent";
  const pdfUrl = await getQuotePdfUrl(orgId, id).catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-neutral-500">{quote.quoteNumber}</p>
        <h1 className="text-2xl font-semibold">{quote.title}</h1>
        <div className="mt-2">
          <StatusBadge status={quote.status} />
        </div>
      </div>

      {pdfUrl && !pdfUrl.startsWith("data:") && (
        <a href={pdfUrl} className="lp-link-quiet text-sm" target="_blank" rel="noreferrer">
          Download PDF
        </a>
      )}

      <table className="w-full text-sm">
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-[var(--border-subtle)]">
              <td className="py-2">{line.description}</td>
              <td className="py-2 text-right">{formatCents(line.lineTotalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm font-medium text-right">
        Total {formatCents(quote.totalCents)}
      </p>

      {quote.notesClient && (
        <p className="text-sm text-neutral-600 border rounded-md p-3">
          {quote.notesClient}
        </p>
      )}

      {response && (
        <p className="text-sm">
          You {response.decision === "approved" ? "approved" : "declined"} as{" "}
          {response.signerName} on {response.respondedAt.toLocaleString()}.
        </p>
      )}

      {canRespond && (
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm text-neutral-600">
            Type your full name to approve or decline this quote.
          </p>
          <form
            action={respondToQuote.bind(null, orgId, id)}
            className="space-y-3 max-w-md"
          >
            <input type="hidden" name="decision" value="approved" />
            <label className="block text-sm">
              Your name
              <input
                name="signerName"
                required
                className="mt-1 w-full border rounded-md px-3 py-2"
              />
            </label>
            <Button type="submit">Approve quote</Button>
          </form>
          <form
            action={respondToQuote.bind(null, orgId, id)}
            className="space-y-3 max-w-md"
          >
            <input type="hidden" name="decision" value="declined" />
            <label className="block text-sm">
              Your name
              <input
                name="signerName"
                required
                className="mt-1 w-full border rounded-md px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Reason (optional)
              <textarea
                name="declineReason"
                rows={2}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit" variant="secondary">
              Decline
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
