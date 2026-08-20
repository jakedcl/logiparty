import Link from "next/link";
import { LeadForm } from "@/components/marketing/lead-form";

type WorkspaceCta = {
  orgName: string;
  href: string;
  isClient: boolean;
};

export function MarketingHome({
  workspace,
}: {
  workspace?: WorkspaceCta | null;
}) {
  return (
    <div className="marketing min-h-screen text-[var(--m-fg)]">
      <div className="m-atmosphere" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase">
          Logiparty
        </span>
        <div className="flex items-center gap-4 text-sm">
          {workspace ? (
            <a
              href={workspace.href}
              className="text-[var(--m-accent)] hover:underline underline-offset-4"
            >
              Open {workspace.orgName}
            </a>
          ) : (
            <a
              href="#request"
              className="text-[var(--m-muted)] hover:text-[var(--m-fg)] transition-colors"
            >
              Request access
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col justify-end px-5 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="m-hero-copy max-w-3xl">
            <p className="m-fade-up m-delay-0 mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Logiparty
            </p>
            <h1 className="m-fade-up m-delay-1 text-2xl font-medium leading-snug tracking-tight text-[var(--m-fg)] sm:text-3xl md:text-4xl">
              Ops software for 3PLs that run live events.
            </h1>
            <p className="m-fade-up m-delay-2 mt-4 max-w-xl text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
              Inventory, fleet, and crew under your brand — not ours. Invite-only
              while we onboard the first wave.
            </p>
            <div className="m-fade-up m-delay-3 mt-8 flex flex-wrap items-center gap-3">
              {workspace ? (
                <a href={workspace.href} className="m-btn-primary px-6 py-3 text-sm font-semibold">
                  Go to {workspace.isClient ? "portal" : "dashboard"}
                </a>
              ) : (
                <a href="#request" className="m-btn-primary px-6 py-3 text-sm font-semibold">
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

          <div
            className="m-visual pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden
          >
            <div className="m-visual-grid" />
            <div className="m-visual-glow" />
            <div className="m-visual-dock" />
          </div>
        </section>

        <section
          id="how"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One loop: stage → load → return.
            </h2>
            <p className="mt-4 text-[var(--m-muted)] leading-relaxed">
              Client assets sit in the warehouse. You assign inventory, trucks,
              and crew to a job with load-in / load-out windows. Staff see only
              their assigned work. Clients see only their company — on your
              subdomain, with your logo.
            </p>
          </div>
        </section>

        <section
          id="request"
          className="relative z-10 border-t border-[var(--m-line)] px-5 py-20 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Request access
            </h2>
            <p className="mt-3 text-sm text-[var(--m-muted)] leading-relaxed">
              No self-serve signup yet. Tell us about your 3PL — we&apos;ll
              invite you if it&apos;s a match.
            </p>
            <div className="mt-8">
              <LeadForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--m-line)] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] uppercase">
              Logiparty
            </p>
            <p className="mt-2 text-sm text-[var(--m-muted)]">
              Multi-tenant ops for event logistics 3PLs.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--m-muted)]">
            <a href="#request" className="hover:text-[var(--m-fg)] transition-colors">
              Request access
            </a>
            <a href="#how" className="hover:text-[var(--m-fg)] transition-colors">
              How it works
            </a>
            <Link
              href="/login"
              className="hover:text-[var(--m-fg)] transition-colors"
            >
              Sign in
            </Link>
            <a
              href="mailto:hello@logiparty.com"
              className="hover:text-[var(--m-fg)] transition-colors"
            >
              hello@logiparty.com
            </a>
          </nav>
        </div>
        <p className="mt-8 text-xs text-[var(--m-muted)]/70">
          © {new Date().getFullYear()} Logiparty. Existing customers sign in at{" "}
          <span className="text-[var(--m-muted)]">
            your-org.logiparty.com
          </span>
          .
        </p>
      </footer>
    </div>
  );
}
