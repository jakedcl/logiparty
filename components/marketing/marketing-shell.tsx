import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingNavLinks } from "@/components/marketing/marketing-nav";
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
      <MarketingHeader>
        <MarketingNavLinks className="flex items-center gap-4 text-sm" />
      </MarketingHeader>

      <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="m-panel m-rise mx-auto max-w-3xl p-5 sm:p-7">
          {children}
        </div>
      </main>

      <MarketingFooter active={active} maxWidth="max-w-3xl" />
    </MarketingRoot>
  );
}
