import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  convertQuoteToJob,
  deleteQuoteLine,
  getQuoteDetail,
  getQuotePdfUrl,
  reviseQuote,
  sendQuote,
  updateQuoteMeta,
  upsertQuoteLine,
} from "@/lib/actions/quotes";
import { listRateCardLines } from "@/lib/actions/rate-cards";
import { canManageCommercial } from "@/lib/auth/permissions";
import { formatCents } from "@/lib/commercial/money";
import { requireSession } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = { params: Promise<{ id: string }> };

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  if (!canManageCommercial(session.user)) redirect("/dashboard");
  const orgId = session.user.orgId;

  const detail = await getQuoteDetail(orgId, id);
  if (!detail) notFound();
  const { quote, lines, clientName, response } = detail;
  const editable = quote.status === "draft" || quote.status === "declined";
  const rateLines = editable ? await listRateCardLines(orgId) : [];

  const pdfUrl = await getQuotePdfUrl(orgId, id).catch(() => null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500 font-mono">{quote.quoteNumber}</p>
          <h1 className="text-2xl font-semibold">{quote.title}</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {clientName} · v{quote.version}
          </p>
        </div>
        <StatusBadge status={quote.status} kind="quote" />
      </div>

      <div className="flex flex-wrap gap-2">
        {editable && (
          <form action={sendQuote.bind(null, orgId, id)}>
            <Button type="submit">Send to client</Button>
          </form>
        )}
        {(quote.status === "sent" ||
          quote.status === "declined" ||
          quote.status === "expired") &&
          !quote.jobId && (
            <form action={reviseQuote.bind(null, orgId, id)}>
              <Button type="submit" variant="secondary">
                Revise (new version)
              </Button>
            </form>
          )}
        {quote.status === "approved" && !quote.jobId && (
          <form action={convertQuoteToJob.bind(null, orgId, id)}>
            <Button type="submit">Convert to job</Button>
          </form>
        )}
        {quote.jobId && (
          <Link href={`/dashboard/jobs/${quote.jobId}`} className="lp-link-quiet">
            View job →
          </Link>
        )}
        {pdfUrl && !pdfUrl.startsWith("data:") && (
          <a href={pdfUrl} className="lp-link-quiet" target="_blank" rel="noreferrer">
            Download PDF
          </a>
        )}
      </div>

      {response && (
        <p className="text-sm border border-[var(--border)] rounded-md px-3 py-2">
          {response.decision === "approved" ? "Approved" : "Declined"} by{" "}
          <strong>{response.signerName}</strong> on{" "}
          {response.respondedAt.toLocaleString()}
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Line items</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-neutral-500">No lines yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-500 border-b">
                <th className="text-left py-1">Description</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Amount</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{line.description}</td>
                  <td className="py-2 text-right">{line.quantity}</td>
                  <td className="py-2 text-right">
                    {formatCents(line.lineTotalCents)}
                  </td>
                  {editable && (
                    <td className="py-2 text-right">
                      <form
                        action={deleteQuoteLine.bind(null, orgId, id, line.id)}
                      >
                        <button type="submit" className="text-xs text-red-600">
                          Remove
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-sm text-right font-medium pt-2">
          Total {formatCents(quote.totalCents)} (tax{" "}
          {formatCents(quote.taxCents)})
        </p>
      </section>

      {editable && (
        <details className="lp-collapse" open={lines.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">
            + Add line
          </summary>
          <form
            action={upsertQuoteLine.bind(null, orgId, id)}
            className="mt-3 grid gap-3 sm:grid-cols-2 max-w-2xl"
          >
            {rateLines.length > 0 && (
              <label className="sm:col-span-2 text-sm">
                From rate card
                <select
                  name="rateCardLineId"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Custom line…</option>
                  {rateLines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.description} · {formatCents(r.unitPriceCents)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm sm:col-span-2">
              Description
              <input name="description" className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              Quantity
              <input
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue="1"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Unit price ($)
              <input
                name="unitPrice"
                defaultValue="0"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit" className="sm:col-span-2 w-fit">
              Add line
            </Button>
          </form>
        </details>
      )}

      {editable && (
        <form
          action={updateQuoteMeta.bind(null, orgId, id)}
          className="space-y-3 max-w-lg border-t pt-4"
        >
          <h2 className="text-sm font-medium">Details</h2>
          <label className="block text-sm">
            Title
            <input
              name="title"
              defaultValue={quote.title}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Deposit ($)
            <input
              name="deposit"
              defaultValue={
                quote.depositCents != null
                  ? (quote.depositCents / 100).toFixed(2)
                  : ""
              }
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Notes for client (on PDF)
            <textarea
              name="notesClient"
              defaultValue={quote.notesClient ?? ""}
              rows={2}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" variant="secondary">
            Save details
          </Button>
        </form>
      )}
    </div>
  );
}
