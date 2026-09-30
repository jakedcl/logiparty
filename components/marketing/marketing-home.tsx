import Link from "next/link";
import { LeadForm } from "@/components/marketing/lead-form";
import { marketingFontVars } from "@/components/marketing/fonts";
import { MarketingMotion } from "@/components/marketing/marketing-motion";

type WorkspaceCta = {
  orgName: string;
  href: string;
  isClient: boolean;
};

const BAYS = [
  {
    id: "jobs",
    num: "01",
    title: "Jobs",
    body: "Draft → upcoming → ready → completed. Load-in and load-out, inventory, fleet, and crew on one run sheet. Staff only see what they’re assigned.",
    shape: "a",
  },
  {
    id: "inventory",
    num: "02",
    title: "Inventory & fleet",
    body: "Client assets stay reserved until load-out ends. Loaded quantities live on the job — not in a spreadsheet that dies at call time.",
    shape: "b",
  },
  {
    id: "portal",
    num: "03",
    title: "Client portal",
    body: "Branded requests, docs, and inventory asks on your subdomain. Company-scoped. Your crew never sees Logiparty.",
    shape: "c",
  },
  {
    id: "staff",
    num: "04",
    title: "Staff on the dock",
    body: "My Jobs only. Loaded vs assigned. Print the run sheet from a phone when the truck is already at the door.",
    shape: "d",
  },
] as const;

const STEPS = [
  {
    num: "01",
    title: "Stage",
    body: "Client assets sit in the warehouse. You assign inventory, fleet, and crew with real load-in / load-out windows.",
  },
  {
    num: "02",
    title: "Load",
    body: "Staff work assigned jobs only. Quantities and docs live on the job — ready for the dock and the venue.",
  },
  {
    num: "03",
    title: "Return",
    body: "After load-out ends, inventory and fleet locks release. Assets go back to storage for the next activation.",
  },
] as const;

export function MarketingHome({
  workspace,
}: {
  workspace?: WorkspaceCta | null;
}) {
  return (
    <div className={`marketing ${marketingFontVars} min-h-screen`}>
      <MarketingMotion>
        <header className="m-header">
          <a href="#top" className="m-brand">
            Logiparty
          </a>
          <nav className="m-nav" aria-label="Primary">
            <a href="#product" className="m-nav-link hidden sm:inline">
              Bays
            </a>
            <Link href="/demo" className="m-nav-link">
              Demo
            </Link>
            <a href="#how" className="m-nav-link hidden sm:inline">
              Run
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

        <main id="top">
          <section className="m-hero" aria-label="Intro">
            <div className="m-hero-plane" aria-hidden />
            <div className="m-hero-tape" aria-hidden />
            <div className="m-hero-door" aria-hidden />
            <div className="m-hero-marks" aria-hidden />

            <div className="m-hero-copy">
              <p className="m-hero-bay m-mono">Bay 00 · Apex</p>
              <p className="m-hero-brand m-display" aria-label="Logiparty">
                <span>Logi</span>
                <span>party</span>
              </p>
              <h1 className="m-hero-line">
                Ops software for 3PLs that run live events.
              </h1>
              <p className="m-hero-sub">
                Jobs, inventory, fleet, and a branded client portal — under your
                name, on your subdomain. Invite-only.
              </p>
              <div className="m-hero-ctas">
                {workspace ? (
                  <a href={workspace.href} className="m-btn-primary">
                    Go to {workspace.isClient ? "portal" : "dashboard"}
                  </a>
                ) : (
                  <Link href="/demo" className="m-btn-primary">
                    Try the demo
                  </Link>
                )}
                {workspace ? (
                  <Link href="/demo" className="m-btn-ghost">
                    Product tour
                  </Link>
                ) : (
                  <a href="#request" className="m-btn-ghost">
                    Request access
                  </a>
                )}
              </div>
            </div>
          </section>

          <div className="m-bays-rail" id="product">
            <div>
              <h2 className="m-display">The bays</h2>
              <p>
                Four lanes of the warehouse-to-venue loop. Scroll the strip —
                or open the interactive demo.
              </p>
            </div>
            <Link href="/demo" className="m-btn-primary">
              Start interactive demo
            </Link>
          </div>

          <div className="m-bays" data-bay-strip>
            {BAYS.map((bay, i) => (
              <article
                key={bay.id}
                className="m-bay"
                data-bay
                data-active={i === 0 ? "true" : "false"}
                id={bay.id}
              >
                <p className="m-bay-num m-mono" aria-hidden>
                  {bay.num}
                </p>
                <h3 className="m-bay-title m-display">{bay.title}</h3>
                <p className="m-bay-body">{bay.body}</p>
                <div
                  className={`m-bay-shape m-bay-shape-${bay.shape}`}
                  aria-hidden
                />
              </article>
            ))}
          </div>

          <section className="m-gap" id="problem" aria-labelledby="gap-title">
            <div className="m-gap-inner">
              <p className="m-gap-label m-mono">The gap</p>
              <h2 id="gap-title" className="m-display">
                Spreadsheets break when the load-out window moves.
              </h2>
              <p>
                Group chats lose the run sheet. Generic WMS doesn&apos;t know a
                festival load-in. Event logistics needs one place for the job,
                the assets locked to it, the trucks and crew, and a portal
                clients can use — without platform branding in front of your
                staff.
              </p>
            </div>
          </section>

          <section
            className="m-timeline"
            id="how"
            data-timeline
            aria-labelledby="timeline-title"
          >
            <div className="m-timeline-head">
              <p className="m-gap-label m-mono">How it runs</p>
              <h2 id="timeline-title" className="m-display">
                Stage → load → return
              </h2>
            </div>
            <div className="m-timeline-track" data-timeline-track>
              <div className="m-timeline-fill" aria-hidden />
              <div className="m-timeline-marker" aria-hidden />
              {STEPS.map((step) => (
                <div key={step.num} className="m-timeline-step">
                  <p className="m-timeline-step-num m-mono">{step.num}</p>
                  <h3 className="m-display">{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            className="m-manifest"
            id="request"
            aria-labelledby="manifest-title"
          >
            <div className="m-manifest-grid">
              <div className="m-manifest-copy">
                <p className="m-gap-label m-mono">Manifest</p>
                <h2 id="manifest-title" className="m-display">
                  Request access
                </h2>
                <p>
                  No self-serve signup. Tell us about your 3PL — we hand-onboard
                  orgs that fit. Prefer email?{" "}
                  <a href="mailto:hello@logiparty.com">hello@logiparty.com</a>
                </p>
                <p>
                  Existing customers sign in at{" "}
                  <span className="m-mono text-[var(--m-concrete)]">
                    your-org.logiparty.com
                  </span>
                  . Want a look first?{" "}
                  <Link href="/demo">Open the demo</Link>.
                </p>
              </div>
              <div className="m-ticket">
                <div className="m-ticket-head">
                  <span>Access request</span>
                  <span>Form · A-01</span>
                </div>
                <div className="m-ticket-body">
                  <LeadForm />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="m-footer">
          <div className="m-footer-inner">
            <div>
              <p className="m-footer-brand">Logiparty</p>
              <p className="m-footer-tag">
                Multi-tenant ops for event logistics 3PLs.
              </p>
            </div>
            <nav aria-label="Footer">
              <Link href="/demo" className="m-nav-link">
                Demo
              </Link>
              <a href="#request" className="m-nav-link">
                Request access
              </a>
              <a href="#product" className="m-nav-link">
                Bays
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
          <p className="m-footer-copy">
            © {new Date().getFullYear()} Logiparty
          </p>
        </footer>
      </MarketingMotion>
    </div>
  );
}
