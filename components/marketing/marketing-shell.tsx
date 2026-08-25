import Link from "next/link";
import type { ReactNode } from "react";

/** Shared apex marketing chrome (header + footer) for legal / secondary pages. */
export function MarketingShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "privacy" | "terms";
}) {
  return (
    <div className="marketing min-h-screen text-[var(--m-fg)]">
      <div className="m-atmosphere" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] uppercase"
        >
          Logiparty
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/#request"
            className="font-medium text-[var(--m-accent)] underline-offset-4 hover:underline"
          >
            Request access
          </Link>
        </nav>
      </header>

      <main className="relative z-10 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        {children}
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
            <Link
              href="/"
              className="transition-colors hover:text-[var(--m-fg)]"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className={
                active === "privacy"
                  ? "text-[var(--m-fg)]"
                  : "transition-colors hover:text-[var(--m-fg)]"
              }
              aria-current={active === "privacy" ? "page" : undefined}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={
                active === "terms"
                  ? "text-[var(--m-fg)]"
                  : "transition-colors hover:text-[var(--m-fg)]"
              }
              aria-current={active === "terms" ? "page" : undefined}
            >
              Terms
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
