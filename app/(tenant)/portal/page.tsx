import Link from "next/link";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";
import { PageHeader } from "@/components/ui/page-header";

export default async function PortalHomePage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const firstName = session.user.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={
          company
            ? `${company.name} · requests and documents for your jobs`
            : "Your client portal"
        }
      />

      <nav className="lp-nav-list" aria-label="Portal sections">
        <Link href="/portal/jobs">
          <span className="font-semibold text-[var(--foreground)]">Jobs</span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            Track status and submit requests
          </span>
        </Link>
        <Link href="/portal/inventory">
          <span className="font-semibold text-[var(--foreground)]">
            Inventory
          </span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            Items stored with {session.user.orgName} for{" "}
            {company?.name ?? "your company"}
          </span>
        </Link>
        <Link href="/portal/notes">
          <span className="font-semibold text-[var(--foreground)]">Notes</span>
          <span className="mt-0.5 block text-sm text-[var(--muted)]">
            Send a general message to {session.user.orgName}
          </span>
        </Link>
      </nav>
    </div>
  );
}
