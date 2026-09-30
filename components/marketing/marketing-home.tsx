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

const TOUR = [
  {
    id: "jobs",
    label: "01",
    title: "Jobs",
    body: "Statuses, calendar, and a run sheet with locations, loads, trucks, and crew.",
    mock: "jobs",
  },
  {
    id: "inventory",
    label: "02",
    title: "Inventory & fleet",
    body: "Client gear, your equipment, and vehicles — locked to the job while it’s live.",
    mock: "inventory",
  },
  {
    id: "portal",
    label: "03",
    title: "Client portal",
    body: "Branded requests, docs, and inventory asks. Company-scoped. Invite-only.",
    mock: "portal",
  },
  {
    id: "staff",
    label: "04",
    title: "Staff on the dock",
    body: "My Jobs only. Loaded vs assigned. Print the run sheet from a phone.",
    mock: "staff",
  },
] as const;

function MockJobs() {
  return (
    <div className="m-mock">
      <div className="m-mock-bar">
        <span>Jobs</span>
        <span className="m-mock-muted">List · Calendar</span>
      </div>
      <div className="m-mock-rows">
        {[
          ["Waterfront Festival", "ready"],
          ["Campus Pop-Up", "upcoming"],
          ["Outdoor Patio", "draft"],
          ["Trade Show Wrap", "completed"],
        ].map(([name, status]) => (
          <div key={name} className="m-mock-row">
            <span>{name}</span>
            <span className={`m-mock-chip m-mock-chip-${status}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockInventory() {
  return (
    <div className="m-mock">
      <div className="m-mock-bar">
        <span>Inventory</span>
        <span className="m-mock-muted">Client · Equipment · Fleet</span>
      </div>
      <div className="m-mock-rows">
        {[
          ["SB-BAR-01", "Branded Bar", "10"],
          ["SB-COOLER", "Rolling Cooler", "36"],
          ["DOLLY-01", "Dolly", "40"],
          ["Box Truck 12", "Fleet", "NL-012"],
        ].map(([a, b, c]) => (
          <div key={a} className="m-mock-row m-mock-row-3">
            <span className="m-mock-mono">{a}</span>
            <span>{b}</span>
            <span className="m-mock-muted">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPortal() {
  return (
    <div className="m-mock">
      <div className="m-mock-bar m-mock-bar-brand">
        <span>Northline Logistics</span>
        <span className="m-mock-muted">Client portal</span>
      </div>
      <div className="m-mock-rows">
        <div className="m-mock-row">
          <span>Your jobs</span>
          <span className="m-mock-chip m-mock-chip-ready">ready</span>
        </div>
        <div className="m-mock-row">
          <span>Waterfront Festival</span>
          <span className="m-mock-muted">Sep 19</span>
        </div>
        <div className="m-mock-row">
          <span>Request inventory change</span>
          <span className="m-mock-muted">+24 coolers</span>
        </div>
      </div>
    </div>
  );
}

function MockStaff() {
  return (
    <div className="m-mock">
      <div className="m-mock-bar">
        <span>My Jobs</span>
        <span className="m-mock-muted">Staff</span>
      </div>
      <div className="m-mock-rows">
        <div className="m-mock-row">
          <span>Waterfront Festival</span>
          <span className="m-mock-chip m-mock-chip-ready">ready</span>
        </div>
        <div className="m-mock-row m-mock-row-3">
          <span>Branded Bar</span>
          <span className="m-mock-muted">3 assigned</span>
          <span className="text-[#1b6b2a]">3 loaded</span>
        </div>
        <div className="m-mock-row m-mock-row-3">
          <span>Dolly</span>
          <span className="m-mock-muted">10 assigned</span>
          <span className="text-[#1b6b2a]">10 loaded</span>
        </div>
      </div>
    </div>
  );
}

function TourMock({ kind }: { kind: (typeof TOUR)[number]["mock"] }) {
  switch (kind) {
    case "jobs":
      return <MockJobs />;
    case "inventory":
      return <MockInventory />;
    case "portal":
      return <MockPortal />;
    case "staff":
      return <MockStaff />;
  }
}

export function MarketingHome({
  workspace,
}: {
  workspace?: WorkspaceCta | null;
}) {
  return (
    <div className="marketing min-h-screen">
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

      <main id="top" className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="m-hero p-5 sm:p-7">
            <p className="text-2xl font-bold text-[var(--m-accent)] sm:text-3xl">
              Logiparty
            </p>
            <h1 className="mt-2 text-lg font-semibold text-[var(--m-fg)] sm:text-xl">
              Ops software for 3PLs that run live events.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Jobs, inventory, fleet, and a branded client portal — under your
              name, on your subdomain. Invite-only while we onboard carefully.
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
          </section>

          <section id="tour" className="m-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-xl">
                <h2 className="m-section-title">Product demo</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
                  Walk the product — no login. Step through jobs, inventory,
                  fleet, crew, and the client portal. Sample workspace only.
                </p>
              </div>
              <Link
                href="/demo"
                className="m-btn-primary px-4 py-2 text-sm font-semibold"
              >
                Start interactive demo
              </Link>
            </div>

            <div className="m-tour-grid mt-5">
              {TOUR.map((item) => (
                <div key={item.id} className="m-tour-card">
                  <div className="m-tour-card-head">
                    <span className="m-step-num">{item.label}</span>
                    <h3 className="mt-0.5 text-sm font-bold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--m-muted)]">
                      {item.body}
                    </p>
                  </div>
                  <div className="m-tour-card-body">
                    <Link
                      href="/demo"
                      className="block hover:opacity-90"
                      aria-label={`Open demo — ${item.title}`}
                    >
                      <TourMock kind={item.mock} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="problem" className="m-panel p-5 sm:p-6">
            <h2 className="m-section-title">The gap</h2>
            <h3 className="mt-3 text-base font-semibold sm:text-lg">
              Spreadsheets break when the load-out window moves.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Group chats lose the run sheet. Generic WMS doesn&apos;t know a
              festival load-in. Event logistics needs one place for the job, the
              assets locked to it, the trucks and crew, and a portal clients can
              use — without platform branding in front of your staff.
            </p>
          </section>

          <section id="product" className="m-panel p-5 sm:p-6">
            <h2 className="m-section-title">Product</h2>
            <h3 className="mt-3 max-w-xl text-base font-semibold sm:text-lg">
              Built for the warehouse-to-venue loop.
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--m-muted)]">
              Multi-tenant by design. Each 3PL gets an isolated workspace on{" "}
              <span className="font-medium text-[var(--m-fg)]">
                your-org.logiparty.com
              </span>
              , white-labeled end to end.
            </p>

            <ul className="m-capability-list mt-5">
              {CAPABILITIES.map((item) => (
                <li key={item.title} className="m-capability-item">
                  <h4 className="text-sm font-bold sm:text-base">{item.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--m-muted)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="how" className="m-panel p-5 sm:p-6">
            <h2 className="m-section-title">How it works</h2>
            <h3 className="mt-3 text-base font-semibold sm:text-lg">
              Stage → load → return.
            </h3>
            <ol className="m-steps mt-4">
              <li className="m-step">
                <span className="m-step-num" aria-hidden>
                  01
                </span>
                <div>
                  <p className="text-sm font-bold">Stage the job</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--m-muted)]">
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
                  <p className="text-sm font-bold">Run the work</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--m-muted)]">
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
                  <p className="text-sm font-bold">Return &amp; release</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--m-muted)]">
                    After load-out ends, inventory and fleet locks release.
                    Assets go back to storage for the next activation.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section id="request" className="m-panel p-5 sm:p-6">
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
              <div className="m-lead-box">
                <LeadForm />
              </div>
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
