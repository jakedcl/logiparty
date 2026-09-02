import Link from "next/link";
import { LeadForm } from "@/components/marketing/lead-form";

type WorkspaceCta = {
  orgName: string;
  href: string;
  isClient: boolean;
};

const CAPABILITIES = [
  {
    title: "Jobs with real windows",
    body: "Draft → upcoming → ready → completed. Load-in and load-out windows, assigned inventory, fleet, and crew — staff see only their jobs.",
  },
  {
    title: "Inventory that locks",
    body: "Client-owned assets stay in your warehouse until load-out ends. Quantities loaded on the run sheet, not scattered across sheets and texts.",
  },
  {
    title: "White-label portal",
    body: "Clients request jobs and see their inventory on your subdomain, with your logo and color. Your crew never sees Logiparty in the app.",
  },
] as const;

export function MarketingHome({
  workspace,
}: {
  workspace?: WorkspaceCta | null;
}) {
  return (
    <div className="marketing min-h-screen text-[var(--m-fg)]">
      <div className="m-atmosphere" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          className="text-sm font-semibold tracking-[0.2em] uppercase"
        >
          Logiparty
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a
            href="#product"
            className="hidden text-[var(--m-muted)] transition-colors hover:text-[var(--m-fg)] sm:inline"
          >
            Product
          </a>
          <a
            href="#how"
            className="hidden text-[var(--m-muted)] transition-colors hover:text-[var(--m-fg)] sm:inline"
          >
            How it works
          </a>
          {workspace ? (
            <a
              href={workspace.href}
              className="font-medium text-[var(--m-accent)] underline-offset-4 hover:underline"
            >
              Open {workspace.orgName}
            </a>
          ) : (
            <a
              href="#request"
              className="font-medium text-[var(--m-accent)] underline-offset-4 hover:underline"
            >
              Request access
            </a>
          )}
        </nav>
      </header>

      <main id="top">
        {/* Hero — one composition: brand, headline, support, CTAs, full-bleed plane */}
        <section className="relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col justify-end px-5 pb-16 pt-12 sm:px-8 sm:pb-20 lg:px-12 lg:pb-28">
          <div
            className="m-visual pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden
          >
            <div className="m-visual-grid" />
            <div className="m-visual-glow" />
            <div className="m-visual-plane" />
            <div className="m-visual-dock" />
          </div>

          <div className="m-hero-copy relative max-w-3xl">
            <p className="m-fade-up m-delay-0 mb-5 text-[clamp(3.25rem,12vw,7.5rem)] font-bold leading-[0.92] tracking-tight">
              Logiparty
            </p>
            <h1 className="m-fade-up m-delay-1 max-w-2xl text-2xl font-medium leading-snug tracking-tight sm:text-3xl md:text-[2.125rem] md:leading-snug">
              Ops software for 3PLs that run live events.
            </h1>
            <p className="m-fade-up m-delay-2 mt-5 max-w-lg text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
              Jobs, inventory, fleet, and a branded client portal — under your
              name, on your subdomain. Invite-only while we onboard carefully.
            </p>
            <div className="m-fade-up m-delay-3 mt-9 flex flex-wrap items-center gap-3">
              {workspace ? (
                <a
                  href={workspace.href}
                  className="m-btn-primary px-6 py-3 text-sm font-semibold"
                >
                  Go to {workspace.isClient ? "portal" : "dashboard"}
                </a>
              ) : (
                <a
                  href="#request"
                  className="m-btn-primary px-6 py-3 text-sm font-semibold"
                >
                  Request access
                </a>
              )}
              <a
                href="#how"
                className="m-btn-ghost px-5 py-3 text-sm font-medium text-[var(--m-muted)]"
              >
                How it works
              </a>
            </div>
          </div>
        </section>

        {/* Problem — one job */}
        <section
          id="problem"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto max-w-2xl">
            <p className="m-section-label">The gap</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Spreadsheets break when the load-out window moves.
            </h2>
            <p className="mt-5 text-[var(--m-muted)] leading-relaxed sm:text-lg">
              Group chats lose the run sheet. Generic WMS doesn&apos;t know a
              festival load-in. Event logistics needs one place for the job,
              the assets locked to it, the trucks and crew, and a portal your
              clients can actually use — without putting platform branding in
              front of your staff.
            </p>
          </div>
        </section>

        {/* Product — lean capability list, not card spam */}
        <section
          id="product"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto max-w-3xl">
            <p className="m-section-label">Product</p>
            <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for the warehouse-to-venue loop.
            </h2>
            <p className="mt-4 max-w-xl text-[var(--m-muted)] leading-relaxed">
              Multi-tenant by design. Each 3PL gets an isolated workspace on{" "}
              <span className="text-[var(--m-fg)]/90">
                your-org.logiparty.com
              </span>
              , white-labeled end to end.
            </p>

            <ul className="m-capability-list mt-12">
              {CAPABILITIES.map((item) => (
                <li key={item.title} className="m-capability-item">
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto max-w-2xl">
            <p className="m-section-label">How it works</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Stage → load → return.
            </h2>
            <ol className="m-steps mt-10">
              <li className="m-step">
                <span className="m-step-num" aria-hidden>
                  01
                </span>
                <div>
                  <p className="font-medium tracking-tight">Stage the job</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                    Client assets sit in the warehouse. You assign inventory,
                    fleet, and crew with load-in / load-out windows.
                  </p>
                </div>
              </li>
              <li className="m-step">
                <span className="m-step-num" aria-hidden>
                  02
                </span>
                <div>
                  <p className="font-medium tracking-tight">Run the work</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                    Staff work assigned jobs only. Loaded quantities and docs
                    live on the job — ready for the dock and the venue.
                  </p>
                </div>
              </li>
              <li className="m-step">
                <span className="m-step-num" aria-hidden>
                  03
                </span>
                <div>
                  <p className="font-medium tracking-tight">Return &amp; release</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                    After load-out ends, inventory and fleet locks release.
                    Assets go back to storage for the next activation.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Contact / request */}
        <section
          id="request"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:items-start">
            <div>
              <p className="m-section-label">Get in touch</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Request access
              </h2>
              <p className="mt-4 text-[var(--m-muted)] leading-relaxed">
                No self-serve signup. Tell us about your 3PL — we hand-onboard
                orgs that fit. Prefer email?{" "}
                <a
                  href="mailto:hello@logiparty.com"
                  className="text-[var(--m-fg)] underline-offset-4 hover:underline"
                >
                  hello@logiparty.com
                </a>
              </p>
              <p className="mt-6 text-sm text-[var(--m-muted)]/80 leading-relaxed">
                Existing customers sign in at{" "}
                <span className="text-[var(--m-fg)]/75">
                  your-org.logiparty.com
                </span>
                .
              </p>
            </div>
            <div>
              <LeadForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--m-line)] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] uppercase">
              Logiparty
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--m-muted)]">
              Multi-tenant ops for event logistics 3PLs.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--m-muted)]">
            <a
              href="#request"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Request access
            </a>
            <a
              href="#product"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Product
            </a>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Sign in
            </Link>
            <a
              href="mailto:hello@logiparty.com"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              hello@logiparty.com
            </a>
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--m-muted)]/65">
          © {new Date().getFullYear()} Logiparty
        </p>
      </footer>
    </div>
  );
}
