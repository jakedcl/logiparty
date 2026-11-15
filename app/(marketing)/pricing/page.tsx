import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata = marketingMetadata({
  title: "Pricing — Logiparty",
  description:
    "Early-access pricing scoped to your team, job volume, and client portal. Talk through your operation and onboarding with us.",
  path: "/pricing",
});

export const revalidate = 3600;

const INCLUDED = [
  "Dedicated subdomain workspace (your-org.logiparty.com)",
  "Staff dashboard — jobs, inventory, fleet, crew, notifications, reports",
  "White-label client portal with your logo and primary color",
  "Inventory and fleet locks on live jobs",
  "Private job documents and time-limited download links",
  "Activity history, search, and CSV reporting",
] as const;

const ONBOARDING = [
  "Hands-on catalog and role setup before go-live",
  "Client companies and portal contacts configured with you",
  "Rate cards and commercial settings when you need quotes/invoices",
] as const;

export default function PricingPage() {
  return (
    <MarketingShell>
      <p className="text-sm font-semibold text-[var(--m-accent)]">Pricing</p>
      <h1 className="m-section-title mt-2 text-2xl sm:text-3xl">
        Quoted for your operation
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
        Logiparty is in early access, with hands-on onboarding for each team.
        Tell us about your team size, typical job volume, and client portal
        needs. We’ll discuss the scope and send a quote before you commit.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-[var(--m-line)] p-4">
          <h2 className="text-sm font-semibold text-[var(--m-fg)]">Included</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--m-muted)]">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--m-accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-[var(--m-line)] p-4">
          <h2 className="text-sm font-semibold text-[var(--m-fg)]">Onboarding</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--m-muted)]">
            {ONBOARDING.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--m-accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-[var(--m-muted)]">
        <span className="font-semibold text-[var(--m-fg)]">What happens next?</span>{" "}
        We review your request, talk through your workflow, and agree on the
        setup and price together. Requesting access does not start a subscription.
        Quote and invoice requirements can be discussed during onboarding.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/#request" className="m-nav-link-strong text-sm">
          Request access
        </Link>
        <Link href="/demo" className="m-nav-link text-sm">
          Take the guided tour
        </Link>
        <Link href="/#faq" className="m-nav-link text-sm">
          Read FAQ
        </Link>
        <a href="mailto:hello@logiparty.com" className="m-nav-link text-sm">
          hello@logiparty.com
        </a>
      </div>
    </MarketingShell>
  );
}
