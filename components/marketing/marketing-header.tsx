import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui/wordmark";

/**
 * Apex marketing header — restrained bar + Logiparty logo lockup.
 */
export function MarketingHeader({
  brandHref = "/",
  brandAnchor = false,
  className,
  navClassName = "flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm",
  children,
}: {
  brandHref?: string;
  /** In-page anchor (`#top`) instead of a route. */
  brandAnchor?: boolean;
  className?: string;
  navClassName?: string;
  children?: ReactNode;
}) {
  const brand = <Wordmark href={brandHref} anchor={brandAnchor} />;

  return (
    <header
      className={cn(
        "m-header flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8",
        className
      )}
    >
      {brand}
      {children ? <nav className={navClassName}>{children}</nav> : null}
    </header>
  );
}
