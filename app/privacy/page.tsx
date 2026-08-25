import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Privacy — Logiparty",
  description:
    "How Logiparty handles account, lead, and operations data during our invite-only pilot.",
};

const UPDATED = "August 25, 2026";

export default function PrivacyPage() {
  return (
    <MarketingShell active="privacy">
      <article className="mx-auto max-w-2xl">
        <p className="m-section-label">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-[var(--m-muted)]">
          Last updated {UPDATED}. Soft-pilot policy — honest about what we
          collect while we onboard invite-only customers.
        </p>

        <div className="m-legal-prose mt-10 space-y-8 text-[var(--m-muted)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Who we are
            </h2>
            <p className="mt-3">
              Logiparty is multi-tenant ops software for event-logistics 3PLs.
              Accounts are invite-only. Questions:{" "}
              <a
                href="mailto:hello@logiparty.com"
                className="text-[var(--m-fg)] underline-offset-4 hover:underline"
              >
                hello@logiparty.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              What we collect
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="text-[var(--m-fg)]/90">Accounts</span> —
                name, email, password hash (or invite flow), org membership,
                and role (staff / manager / client).
              </li>
              <li>
                <span className="text-[var(--m-fg)]/90">Marketing leads</span> —
                when you request access on{" "}
                <Link
                  href="/"
                  className="text-[var(--m-fg)] underline-offset-4 hover:underline"
                >
                  logiparty.com
                </Link>
                , we store the form fields you submit so we can reply.
              </li>
              <li>
                <span className="text-[var(--m-fg)]/90">
                  Jobs &amp; inventory
                </span>{" "}
                — operational data your org enters: jobs, locations, inventory
                quantities, fleet, crew assignments, documents, and related
                activity. Scoped to your organization (and client company where
                applicable).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Cookies &amp; sessions
            </h2>
            <p className="mt-3">
              We use a session cookie from NextAuth (Auth.js) with a{" "}
              <span className="text-[var(--m-fg)]/90">JWT session</span> (about
              7 days). That cookie keeps you signed in on your tenant subdomain.
              We do not run third-party ad trackers on the marketing site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Where data lives
            </h2>
            <p className="mt-3">
              The app is hosted on{" "}
              <span className="text-[var(--m-fg)]/90">Vercel</span>. Primary
              database is{" "}
              <span className="text-[var(--m-fg)]/90">Neon PostgreSQL</span>.
              Uploaded documents go to object storage (Cloudflare R2).
              Transactional email (invites / notifications) may go through
              Resend when configured. Processors act on our instructions to run
              the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              How we use it
            </h2>
            <p className="mt-3">
              To operate your workspace, authenticate users, reply to access
              requests, improve reliability during the pilot, and contact you
              about the service. We do not sell personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Retention &amp; your choices
            </h2>
            <p className="mt-3">
              Pilot orgs: we keep account and ops data while your workspace is
              active. Lead form submissions stay until we close the loop or you
              ask us to delete them. Email{" "}
              <a
                href="mailto:hello@logiparty.com"
                className="text-[var(--m-fg)] underline-offset-4 hover:underline"
              >
                hello@logiparty.com
              </a>{" "}
              to correct or remove personal data we hold about you, or to close
              an account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Changes
            </h2>
            <p className="mt-3">
              As we leave soft pilot, we may publish a fuller policy. Material
              changes will be reflected on this page with an updated date. See
              also our{" "}
              <Link
                href="/terms"
                className="text-[var(--m-fg)] underline-offset-4 hover:underline"
              >
                Terms
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
