import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Terms — Logiparty",
  description:
    "Soft-pilot terms for invite-only access to Logiparty during early customer onboarding.",
};

const UPDATED = "August 25, 2026";

export default function TermsPage() {
  return (
    <MarketingShell active="terms">
      <article className="mx-auto max-w-2xl">
        <p className="m-section-label">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms
        </h1>
        <p className="mt-3 text-sm text-[var(--m-muted)]">
          Last updated {UPDATED}. Soft-pilot terms — invite-only access while we
          onboard carefully.
        </p>

        <div className="m-legal-prose mt-10 space-y-8 text-[var(--m-muted)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              The short version
            </h2>
            <p className="mt-3">
              Logiparty is early-stage software offered by invitation. If we
              grant your org access, you get a tenant workspace on a subdomain
              (e.g.{" "}
              <span className="text-[var(--m-fg)]/90">
                your-org.logiparty.com
              </span>
              ) to run jobs, inventory, fleet, and a client portal. Use it
              professionally; don’t abuse the service or other customers’ data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Invite-only pilot
            </h2>
            <p className="mt-3">
              There is no self-serve signup. Requesting access on the marketing
              site does not guarantee an account. We may accept, decline, or
              delay onboarding. Pilot features, uptime, and support are
              best-effort — not a formal SLA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Your responsibilities
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Keep login credentials secure and invite only people who should
                access your org.
              </li>
              <li>
                Enter accurate operational data you are allowed to process
                (jobs, inventory, client contacts, documents).
              </li>
              <li>
                Do not attempt to access another organization’s tenant, scrape
                the service, or disrupt hosting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Our service
            </h2>
            <p className="mt-3">
              We host the product on Vercel with data in Neon PostgreSQL (and
              related providers for files and email). We may change, pause, or
              discontinue pilot features. We are not liable for business
              decisions made from app data, or for outages outside our
              reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Your content
            </h2>
            <p className="mt-3">
              You retain rights to the data you put in Logiparty. You grant us
              a limited license to host, process, and display that data solely
              to provide the service to your organization. See our{" "}
              <Link
                href="/privacy"
                className="text-[var(--m-fg)] underline-offset-4 hover:underline"
              >
                Privacy
              </Link>{" "}
              page for how we handle personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--m-fg)]">
              Contact
            </h2>
            <p className="mt-3">
              Questions about these terms:{" "}
              <a
                href="mailto:hello@logiparty.com"
                className="text-[var(--m-fg)] underline-offset-4 hover:underline"
              >
                hello@logiparty.com
              </a>
              . We may update this page as the pilot matures; the date above
              will change when we do.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
