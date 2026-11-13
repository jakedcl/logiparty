import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommercialFlow } from "@/components/marketing/commercial-flow";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { LeadForm } from "@/components/marketing/lead-form";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingNavLinks } from "@/components/marketing/marketing-nav";
import { MarketingRoot } from "@/components/marketing/marketing-root";

const SECURITY_POINTS = [
  "Separate workspaces for each logistics company.",
  "Role-based access for managers, crew, and client contacts.",
  "Client access scoped to their own company’s jobs and inventory.",
  "Private document storage with time-limited download links.",
] as const;

const ONBOARDING = [
  { title: "Talk through your operation", body: "Tell us about your clients, stored gear, and how a typical job runs." },
  { title: "Set up your workspace", body: "We work with you on catalogs, roles, client contacts, and your branding." },
  { title: "Walk through your first job", body: "Review the workflow with your team before you start using it day to day." },
] as const;

export function MarketingHome() {
  return (
    <MarketingRoot>
      <MarketingHeader brandHref="#top" brandAnchor>
        <MarketingNavLinks />
      </MarketingHeader>

      <main id="top" className="relative z-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12">
          <section className="m-hero p-6 sm:p-10 lg:p-12">
            <div className="m-hero-split">
              <div>
                <p className="m-eyebrow">Operations software for event-logistics 3PLs</p>
                <h1 className="m-hero-title mt-4">
                  Keep every event job moving.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
                  Plan client inventory, trucks, crew, and load windows in one
                  workspace. Give clients a portal that feels like your business.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild className="px-5 py-3 text-sm">
                    <a href="#request">Request access</a>
                  </Button>
                  <Button asChild variant="outline" className="px-5 py-3 text-sm">
                    <Link href="/demo">Take a guided tour <span aria-hidden>→</span></Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[var(--m-muted)]">
                  Early access · Hands-on onboarding · No login needed for the tour
                </p>
              </div>
              <HeroProductPreview />
            </div>
          </section>

          <section id="about" className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <p className="m-eyebrow mb-3">Built around the job</p>
            <h2 className="m-section-title">From warehouse to venue, together.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Third-party logistics companies that warehouse, transport, and crew
              live events — festivals, tours, corporate activations, and venue
              deliveries. Keep the run sheet, reserved gear, assigned people, and
              client updates connected as plans change.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Early access is invite-only: we configure roles, catalogs, subdomain
              branding, and rate cards before your team goes live.
            </p>
          </section>

          <section className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="m-eyebrow mb-3">One connected workspace</p>
                <h2 className="m-section-title">The details your next job depends on.</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
                  See the staff workspace and client portal below, using sample
                  data from Northline Logistics.
                </p>
              </div>
              <Link href="/demo" className="m-nav-link-strong text-sm">
                Explore the guided tour →
              </Link>
            </div>
            <div className="mt-6">
              <FeatureShowcase />
            </div>
          </section>

          <section id="how" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">How it works</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
              From client request to invoice — one workspace on your subdomain.
            </p>
            <div className="mt-5">
              <CommercialFlow />
            </div>
          </section>

          <section id="onboarding" className="m-panel p-5 sm:p-8">
            <p className="m-eyebrow mb-3">A supported start</p>
            <h2 className="m-section-title">Set up for the way you work.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Early access includes a conversation and hands-on setup. We work
              with your team on the details before your workspace goes live.
            </p>
            <ol className="mt-7 grid gap-6 sm:grid-cols-3">
              {ONBOARDING.map((step, index) => (
                <li key={step.title}>
                  <p className="m-eyebrow">0{index + 1}</p>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--m-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <MarketingFaq />

          <section id="security" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">Access that fits your team</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              {SECURITY_POINTS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--m-accent)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="request" className="m-panel m-rise m-rise-3 p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
              <div>
                <h2 className="m-section-title">Request access</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
                  Tell us about your 3PL and we&apos;ll follow up for early access
                  onboarding. Prefer email?{" "}
                  <a
                    href="mailto:hello@logiparty.com"
                    className="m-nav-link-strong"
                  >
                    hello@logiparty.com
                  </a>
                </p>
                <p className="mt-4 text-sm text-[var(--m-muted)] leading-relaxed">
                  Already onboarded?{" "}
                  <Link href="/login" className="m-nav-link-strong">
                    Find your workspace
                  </Link>
                  . Want a look first?{" "}
                  <Link href="/demo" className="m-nav-link-strong">
                    Take the guided tour
                  </Link>
                  .
                </p>
              </div>
              <LeadForm />
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </MarketingRoot>
  );
}

function HeroProductPreview() {
  return (
    <figure className="m-product-preview">
      <figcaption className="flex items-center justify-between gap-4 border-b border-[var(--m-line)] px-4 py-3 text-xs text-[var(--m-muted)]">
        <span className="font-semibold text-[var(--m-fg)]">Northline Logistics</span>
        <span>Sample workspace</span>
      </figcaption>
      <Image
        src="/marketing/jobs-list.png"
        alt="Northline Logistics jobs list showing statuses and load windows"
        width={1200}
        height={750}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 560px, (min-width: 900px) 50vw, 100vw"
        priority
      />
    </figure>
  );
}
