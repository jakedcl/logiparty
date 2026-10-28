import Link from "next/link";
import { redirect } from "next/navigation";
import { createQuote, listQuotes } from "@/lib/actions/quotes";
import { listJobClientCompanies } from "@/lib/actions/jobs";
import { canManageCommercial } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function QuotesPage() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) redirect("/dashboard");

  const orgId = session.user.orgId;
  const [rows, clients] = await Promise.all([
    listQuotes(orgId),
    listJobClientCompanies(orgId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Quotes</h1>
        <p className="text-sm text-neutral-500">
          Proposals for clients — send for portal approval, then convert to
          jobs.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">
          No quotes yet. Create one below or set up rate cards in Settings →
          Pricing.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[36rem] text-sm text-left">
            <thead>
              <tr className="border-y border-neutral-100 text-neutral-500 bg-neutral-50/80">
                <th className="py-2 px-3 font-medium">Number</th>
                <th className="py-2 px-3 font-medium">Title</th>
                <th className="py-2 px-3 font-medium">Client</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map((q) => (
                <tr key={q.id}>
                  <td className="py-2 px-3 font-mono text-xs">{q.quoteNumber}</td>
                  <td className="py-2 px-3">{q.title}</td>
                  <td className="py-2 px-3 text-neutral-600">
                    {q.clientName ?? "—"}
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Link
                      href={`/dashboard/quotes/${q.id}`}
                      className="lp-link-quiet"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="lp-collapse">
        <summary className="cursor-pointer text-sm font-medium">
          + New quote
        </summary>
        <form
          action={createQuote.bind(null, orgId)}
          className="mt-4 space-y-3 max-w-md"
        >
          <label className="block text-sm">
            Title
            <input
              name="title"
              required
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Event or project name"
            />
          </label>
          <label className="block text-sm">
            Client company
            <select
              name="clientCompanyId"
              required
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Create draft</Button>
        </form>
      </details>
    </div>
  );
}
