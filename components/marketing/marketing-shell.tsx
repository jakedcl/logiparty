import Link from "next/link";
import type { ReactNode } from "react";
import { MarketingRoot } from "@/components/marketing/marketing-root";

/** Shared apex marketing chrome (header + footer) for legal / secondary pages. */
export function MarketingShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "privacy" | "terms";
}) {
  return (
    <MarketingRoot>
      <div className="m-bubbles" aria-hidden>
        <span className="m-bubble m-bubble-a" />
        <span className="m-bubble m-bubble-b" />
        <span className="m-bubble m-bubble-c" />
      </div>

      <header className="m-header flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="m-brand">
          Logiparty
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/demo" className="m-nav-link">
            Demo
          </Link>
          <Link href="/#request" className="m-nav-link-strong">
            Request access
          </Link>
        </nav>
      </header>

      <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="m-panel m-rise mx-auto max-w-3xl p-5 sm:p-7">
          {children}
        </div>
      </main>

      <footer className="m-footer mt-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--m-accent)]">Logiparty</p>
            <p className="mt-1 max-w-sm text-xs text-[var(--m-muted)]">
              Multi-tenant ops for event logistics 3PLs.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--m-muted)]">
            <Link href="/" className="m-nav-link">
              Home
            </Link>
            <Link href="/demo" className="m-nav-link">
              Demo
            </Link>
            <Link
              href="/privacy"
              className={
                active === "privacy" ? "m-nav-link m-nav-link-current" : "m-nav-link"
              }
              aria-current={active === "privacy" ? "page" : undefined}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={
                active === "terms" ? "m-nav-link m-nav-link-current" : "m-nav-link"
              }
              aria-current={active === "terms" ? "page" : undefined}
            >
              Terms
            </Link>
            <a href="mailto:hello@logiparty.com" className="m-nav-link">
              hello@logiparty.com
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-xs text-[var(--m-muted)]">
          © {new Date().getFullYear()} Logiparty
        </p>
      </footer>
    </MarketingRoot>
  );
}
