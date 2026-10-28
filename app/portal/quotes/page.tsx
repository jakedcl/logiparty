import Link from "next/link";
import { redirect } from "next/navigation";
import { listPortalQuotes } from "@/lib/actions/quotes";
import { requireSession } from "@/lib/org/context";
import { formatCents } from "@/lib/commercial/money";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function PortalQuotesPage() {
  const session = await requireSession();
  if (!session.user.isClient) redirect("/portal");

  const rows = await listPortalQuotes(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Quotes</h1>
        <p className="text-sm text-neutral-500">
          Review proposals from {session.user.orgName}.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No quotes yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border)]">
          {rows.map((q) => (
            <li key={q.id} className="py-3 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-xs text-neutral-500 font-mono">
                  {q.quoteNumber} · {formatCents(q.totalCents)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={q.status} kind="quote" />
                <Link href={`/portal/quotes/${q.id}`} className="lp-link-quiet">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
