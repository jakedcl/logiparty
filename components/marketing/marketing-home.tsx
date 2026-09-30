import Link from "next/link";
import { AppWindow } from "@/components/marketing/app-window";
import { ComparePane } from "@/components/marketing/compare-pane";
import { LeadForm } from "@/components/marketing/lead-form";
import { MockJobs } from "@/components/marketing/product-mocks";
import { ProductTour } from "@/components/marketing/product-tour";
import { ProcessStepper } from "@/components/marketing/process-stepper";

type WorkspaceCta = {
  orgName: string;
  href: string;
  isClient: boolean;
};

const CAPABILITIES = [
  {
    title: "Jobs with real windows",
    body: "Draft → upcoming → ready → completed. Load-in and load-out, inventory, fleet, and crew on one job. Staff only see what they’re assigned.",
  },
  {
    title: "Inventory that locks",
    body: "Client assets stay reserved until load-out ends. Loaded quantities live on the run sheet — not in a spreadsheet.",
  },
  {
    title: "White-label portal",
    body: "Clients request jobs and see their inventory on your subdomain, with your logo and color. Your crew never sees Logiparty.",
  },
] as const;

export function MarketingHome({
  workspace,
}: {
  workspace?: WorkspaceCta | null;
}) {
  return (
    <div className="marketing min-h-screen">
      <div className="m-bubbles" aria-hidden>
        <span className="m-bubble m-bubble-a" />
        <span className="m-bubble m-bubble-b" />
        <span className="m-bubble m-bubble-c" />
      </div>

      <header className="m-header flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="m-brand">
          Logiparty
        </a>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
          <a href="#product" className="m-nav-link hidden sm:inline">
            Product
          </a>
          <Link href="/demo" className="m-nav-link">
            Demo
          </Link>
          <a href="#how" className="m-nav-link hidden sm:inline">
            How it works
          </a>
          {workspace ? (
            <a href={workspace.href} className="m-nav-link-strong">
              Open {workspace.orgName}
            </a>
          ) : (
            <a href="#request" className="m-nav-link-strong">
              Request access
            </a>
          )}
        </nav>
      </header>

      <main id="top" className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="m-hero p-5 sm:p-7">
            <div className="m-hero-split">
              <div>
                <div className="m-hero-brand">
                  <span className="m-hero-brand-mark" aria-hidden>
                    LP
                  </span>
                  <div>
                    <p className="m-hero-brand-name">Logiparty</p>
                    <p className="m-hero-brand-tag">Event logistics workspace</p>
                  </div>
                </div>
                <h1 className="mt-4 text-lg font-semibold text-[var(--m-fg)] sm:text-xl">
                  Ops software for 3PLs that run live events.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                  Jobs, inventory, fleet, and a branded client portal — under
                  your name, on your subdomain. Invite-only while we onboard
                  carefully.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {workspace ? (
                    <a
                      href={workspace.href}
                      className="m-btn-primary px-4 py-2 text-sm font-semibold"
                    >
                      Go to {workspace.isClient ? "portal" : "dashboard"}
                    </a>
                  ) : (
                    <Link
                      href="/demo"
                      className="m-btn-primary px-4 py-2 text-sm font-semibold"
                    >
                      Try the demo
                    </Link>
                  )}
                  {workspace ? (
                    <Link
                      href="/demo"
                      className="m-btn-ghost px-4 py-2 text-sm font-medium"
                    >
                      Product tour
                    </Link>
                  ) : (
                    <a
                      href="#request"
                      className="m-btn-ghost px-4 py-2 text-sm font-medium"
                    >
                      Request access
                    </a>
                  )}
                </div>
              </div>
              <div className="m-hero-window-stack">
                <div className="m-hero-sticky" aria-hidden>
                  <span className="m-hero-sticky-pin" />
                  Load-out moved — check run sheet
                </div>
                <AppWindow
                  title="Logiparty — Jobs"
                  heroMotion
                  heroChrome
                  inset
                  className="m-hero-window-front"
                >
                  <MockJobs />
                </AppWindow>
              </div>
            </div>
          </section>

          <section id="tour" className="m-panel m-rise m-rise-1 p-5 sm:p-6">
            <ProductTour />
          </section>

          <section id="problem" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">The gap</h2>
            <h3 className="mt-3 text-base font-semibold sm:text-lg">
              Spreadsheets break when the load-out window moves.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Group chats lose the run sheet. Generic WMS doesn&apos;t know a
              festival load-in. Same work — different tools.
            </p>
            <ComparePane />
          </section>

          <section id="product" className="m-panel m-rise m-rise-2 p-5 sm:p-6">
            <h2 className="m-section-title">Product</h2>
            <h3 className="mt-3 max-w-xl text-base font-semibold sm:text-lg">
              Built for the warehouse-to-venue loop.
            </h3>
            <p className="mt-2 mb-4 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
              Multi-tenant by design. Each 3PL gets an isolated workspace on{" "}
              <span className="font-medium text-[var(--m-fg)]">
                your-org.logiparty.com
              </span>
              , white-labeled end to end.
            </p>
            <AppWindow title="Preferences — Capabilities" inset>
              <ul className="m-inspector">
                {CAPABILITIES.map((item, i) => (
                  <li
                    key={item.title}
                    className={`m-inspector-row${i % 2 === 1 ? " m-inspector-row-alt" : ""}`}
                  >
                    <span className="m-inspector-icon" aria-hidden />
                    <div className="m-inspector-copy">
                      <p className="m-inspector-title">{item.title}</p>
                      <p className="m-inspector-body">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </AppWindow>
          </section>

          <section id="how" className="m-panel m-rise m-rise-3 p-5 sm:p-6">
            <h2 className="m-section-title">How it works</h2>
            <h3 className="mt-3 mb-4 text-base font-semibold sm:text-lg">
              Stage → load → return.
            </h3>
            <ProcessStepper />
          </section>

          <section id="request" className="m-panel m-rise m-rise-3 p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
              <div>
                <h2 className="m-section-title">Request access</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
                  No self-serve signup. Tell us about your 3PL — we hand-onboard
                  orgs that fit. Prefer email?{" "}
                  <a
                    href="mailto:hello@logiparty.com"
                    className="m-nav-link-strong"
                  >
                    hello@logiparty.com
                  </a>
                </p>
                <p className="mt-4 text-sm text-[var(--m-muted)] leading-relaxed">
                  Existing customers sign in at{" "}
                  <span className="font-medium text-[var(--m-fg)]">
                    your-org.logiparty.com
                  </span>
                  . Want a look first?{" "}
                  <Link href="/demo" className="m-nav-link-strong">
                    Open the demo
                  </Link>
                  .
                </p>
              </div>
              <AppWindow title="Access Request" className="m-access-window">
                <LeadForm />
              </AppWindow>
            </div>
          </section>
        </div>
      </main>

      <footer className="m-footer mt-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--m-accent)]">Logiparty</p>
            <p className="mt-1 max-w-sm text-xs text-[var(--m-muted)]">
              Multi-tenant ops for event logistics 3PLs.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--m-muted)]">
            <Link href="/demo" className="m-nav-link">
              Demo
            </Link>
            <a href="#request" className="m-nav-link">
              Request access
            </a>
            <a href="#product" className="m-nav-link">
              Product
            </a>
            <Link href="/privacy" className="m-nav-link">
              Privacy
            </Link>
            <Link href="/terms" className="m-nav-link">
              Terms
            </Link>
            <Link href="/login" className="m-nav-link">
              Sign in
            </Link>
            <a href="mailto:hello@logiparty.com" className="m-nav-link">
              hello@logiparty.com
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-5 max-w-5xl text-xs text-[var(--m-muted)]">
          © {new Date().getFullYear()} Logiparty
        </p>
      </footer>
    </div>
  );
}
