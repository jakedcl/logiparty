import Image from "next/image";
import Link from "next/link";
import { LogipartyMark } from "@/components/brand/logiparty-mark";
import { AppWindow } from "@/components/marketing/app-window";
import { Button } from "@/components/ui/button";
import { ComparePane } from "@/components/marketing/compare-pane";
import { CommercialFlow } from "@/components/marketing/commercial-flow";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { LeadForm } from "@/components/marketing/lead-form";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingNavLinks } from "@/components/marketing/marketing-nav";
import { MarketingRoot } from "@/components/marketing/marketing-root";
import { ProcessStepper } from "@/components/marketing/process-stepper";
import { ProductTour } from "@/components/marketing/product-tour";

const SECURITY_POINTS = [
  "Each 3PL workspace is isolated on its own subdomain with org-scoped data in Postgres.",
  "Row-level security enforces tenant boundaries; the app connects as a non-bypass role.",
  "Staff sessions use Auth.js credentials with bcrypt-hashed passwords.",
  "Job documents are served from Cloudflare R2 with short-lived signed URLs.",
] as const;

export function MarketingHome() {
  return (
    <MarketingRoot>
      <MarketingHeader brandHref="#top" brandAnchor>
        <MarketingNavLinks />
      </MarketingHeader>

      <main id="top" className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="m-hero p-5 sm:p-7">
            <div className="m-hero-split">
              <div>
                <div className="m-hero-brand">
                  <LogipartyMark size={52} />
                  <div>
                    <p className="m-hero-brand-name">Logiparty</p>
                    <p className="m-hero-brand-tag">
                      Operations software for event-logistics 3PLs
                    </p>
                  </div>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--m-fg)] sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                  Run sheets, locked inventory, fleet, crew, and a client portal
                  your team white-labels end to end.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
                  Built for the warehouse-to-venue loop on{" "}
                  <span className="font-medium text-[var(--m-fg)]">
                    your-org.logiparty.com
                  </span>
                  . Walk through Northline Logistics sample data in{" "}
                  <Link href="/demo" className="m-nav-link-strong">
                    /demo
                  </Link>{" "}
                  — no login.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button asChild className="px-4 py-2.5 text-sm">
                    <Link href="/demo">Try the demo</Link>
                  </Button>
                  <Button asChild variant="outline" className="px-4 py-2.5 text-sm">
                    <a href="#request">Request access</a>
                  </Button>
                </div>
              </div>
              <HeroScreenshotWindow />
            </div>
          </section>

          <section id="about" className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <h2 className="m-section-title">Who it&apos;s for</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Third-party logistics companies that warehouse, transport, and crew
              live events — festivals, tours, corporate activations, and venue
              deliveries. You need jobs, locks, and a branded client portal without
              a generic WMS or a spreadsheet patchwork.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Early access is invite-only: we configure roles, catalogs, subdomain
              branding, and rate cards before your team goes live.
            </p>
          </section>

          <section className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="m-section-title">Product</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
                  Screenshots below are from the staff app and client portal —
                  Northline Logistics sample tenant, not a mock illustration.
                </p>
              </div>
              <Link href="/demo" className="m-nav-link-strong text-sm">
                Open interactive demo →
              </Link>
            </div>
            <div className="mt-6">
              <FeatureShowcase />
            </div>
          </section>

          <section id="tour" className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <ProductTour />
          </section>

          <section id="problem" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">The gap</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Spreadsheets lose the run sheet when load-out moves. Group chats
              don&apos;t lock inventory. Generic WMS tools weren&apos;t built for
              festival load-in windows.
            </p>
            <ComparePane />
          </section>

          <section id="how" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">How it works</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
              From client request to invoice — one workspace on your subdomain.
            </p>
            <div className="mt-5">
              <CommercialFlow />
            </div>
            <h3 className="mt-8 text-sm font-semibold text-[var(--m-fg)]">
              On the warehouse floor
            </h3>
            <div className="mt-3">
              <ProcessStepper />
            </div>
          </section>

          <MarketingFaq />

          <section id="security" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">Security &amp; isolation</h2>
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
                    Sign in with your org slug
                  </Link>
                  . Want a look first?{" "}
                  <Link href="/demo" className="m-nav-link-strong">
                    Open the demo
                  </Link>
                  .
                </p>
              </div>
              <AppWindow title="Access request" className="m-access-window">
                <LeadForm />
              </AppWindow>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </MarketingRoot>
  );
}

function HeroScreenshotWindow() {
  return (
    <div className="m-hero-window-stack">
      <AppWindow
        title="Northline Logistics — Jobs"
        inset
        className="m-hero-window-front"
      >
        <div className="overflow-hidden rounded-md border border-[var(--m-line)]">
          <Image
            src="/marketing/jobs-list.png"
            alt="Jobs list with status filters and load windows"
            width={1200}
            height={750}
            className="h-auto w-full"
            priority
          />
        </div>
      </AppWindow>
    </div>
  );
}
