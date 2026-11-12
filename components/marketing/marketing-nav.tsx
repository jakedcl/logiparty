import Link from "next/link";

export function MarketingNavLinks({
  className = "flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm",
}: {
  className?: string;
}) {
  return (
    <nav className={className}>
      <Link href="/#about" className="m-nav-link hidden sm:inline">
        Who it&apos;s for
      </Link>
      <Link href="/#features" className="m-nav-link hidden md:inline">
        Features
      </Link>
      <Link href="/#how" className="m-nav-link hidden md:inline">
        How it works
      </Link>
      <Link href="/demo" className="m-nav-link">
        Demo
      </Link>
      <Link href="/pricing" className="m-nav-link hidden sm:inline">
        Pricing
      </Link>
      <Link href="/#request" className="m-nav-link-strong">
        Request access
      </Link>
    </nav>
  );
}
