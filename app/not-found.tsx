import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function NotFound() {
  return (
    <MarketingShell>
      <p className="text-sm font-bold text-[var(--m-accent)]">404</p>
      <h1 className="m-section-title mt-2 text-2xl sm:text-3xl">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
        That URL is not part of the Logiparty marketing site. Staff and clients
        sign in on their organization subdomain, for example{" "}
        <span className="font-medium text-[var(--m-fg)]">
          your-org.logiparty.com
        </span>
        .
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="m-nav-link-strong text-sm">
          Back to home
        </Link>
        <Link href="/demo" className="m-nav-link text-sm">
          Product demo
        </Link>
        <Link href="/pricing" className="m-nav-link text-sm">
          Pricing
        </Link>
      </div>
    </MarketingShell>
  );
}
