import Link from "next/link";
import { LogipartyLogo } from "@/components/brand/logiparty-logo";

const TAGLINE =
  "Operations software for event-logistics 3PLs.";

export function MarketingFooter({
  active,
  maxWidth = "max-w-5xl",
}: {
  active?: "privacy" | "terms";
  maxWidth?: string;
}) {
  return (
    <footer className="m-footer mt-4 px-4 py-8 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex ${maxWidth} flex-col gap-6 sm:flex-row sm:items-end sm:justify-between`}
      >
        <div>
          <LogipartyLogo href="/" showWordmark markSize={24} />
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--m-muted)]">
            {TAGLINE}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--m-muted)]">
          <Link href="/" className="m-nav-link">
            Home
          </Link>
          <Link href="/demo" className="m-nav-link">
            Demo
          </Link>
          <Link href="/pricing" className="m-nav-link">
            Pricing
          </Link>
          <Link href="/#request" className="m-nav-link">
            Request access
          </Link>
          <Link href="/login" className="m-nav-link">
            Sign in
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
      <p className={`mx-auto mt-6 ${maxWidth} text-xs text-[var(--m-muted)]`}>
        © {new Date().getFullYear()} Logiparty
      </p>
    </footer>
  );
}
