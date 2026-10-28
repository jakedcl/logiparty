import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata = marketingMetadata({
  title: "Pricing — Logiparty",
  description:
    "Logiparty pricing is by quote during early access. Request access for your event-logistics 3PL.",
  path: "/pricing",
});

export const revalidate = 3600;

export default function PricingPage() {
  return (
    <MarketingShell>
      <p className="text-sm font-bold text-[var(--m-accent)]">Pricing</p>
      <h1 className="m-section-title mt-2 text-2xl sm:text-3xl">
        Priced for your operation
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
        Logiparty is in early access for event-logistics 3PLs. We quote per
        organization based on team size, job volume, and portal needs — not a
        self-serve checkout.
      </p>

      <ul className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--m-muted)]">
        <li>
          <span className="font-semibold text-[var(--m-fg)]">Included:</span>{" "}
          multi-tenant workspace on your subdomain, staff dashboard, white-label
          client portal, jobs with inventory and fleet locks, document storage,
          and activity history.
        </li>
        <li>
          <span className="font-semibold text-[var(--m-fg)]">Onboarding:</span>{" "}
          hands-on setup for roles, catalogs, and branding before your team goes
          live.
        </li>
        <li>
          <span className="font-semibold text-[var(--m-fg)]">Billing:</span>{" "}
          Stripe subscription plumbing exists in the codebase; we enable it when
          your contract is in place.
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/#request" className="m-nav-link-strong text-sm">
          Request access
        </Link>
        <Link href="/demo" className="m-nav-link text-sm">
          Try the demo
        </Link>
        <a href="mailto:hello@logiparty.com" className="m-nav-link text-sm">
          hello@logiparty.com
        </a>
      </div>
    </MarketingShell>
  );
}
