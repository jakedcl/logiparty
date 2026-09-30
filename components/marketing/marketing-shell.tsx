import Link from "next/link";
import type { ReactNode } from "react";
import { marketingFontVars } from "@/components/marketing/fonts";

/** Shared apex marketing chrome (header + footer) for legal / secondary pages. */
export function MarketingShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "privacy" | "terms";
}) {
  return (
    <div className={`marketing ${marketingFontVars} min-h-screen`}>
      <header className="m-header">
        <Link href="/" className="m-brand">
          Logiparty
        </Link>
        <nav className="m-nav" aria-label="Primary">
          <Link href="/demo" className="m-nav-link">
            Demo
          </Link>
          <Link href="/#request" className="m-nav-link-strong">
            Request access
          </Link>
        </nav>
      </header>

      <main>
        <div className="m-legal-panel">{children}</div>
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
            <Link href="/" className="m-nav-link">
              Home
            </Link>
            <Link href="/demo" className="m-nav-link">
              Demo
            </Link>
            <Link
              href="/privacy"
              className="m-nav-link"
              aria-current={active === "privacy" ? "page" : undefined}
              style={
                active === "privacy" ? { color: "var(--m-yellow)" } : undefined
              }
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="m-nav-link"
              aria-current={active === "terms" ? "page" : undefined}
              style={
                active === "terms" ? { color: "var(--m-yellow)" } : undefined
              }
            >
              Terms
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
    </div>
  );
}
