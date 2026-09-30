import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { marketingFont } from "@/components/marketing/fonts";

type Props = {
  children: ReactNode;
  /** Extra classes on the root (e.g. demo-app layout). */
  className?: string;
};

/**
 * Single server-rendered root for apex marketing surfaces.
 * Keeps next/font on the server (never in client components) so SSR/client HTML match.
 */
export function MarketingRoot({ children, className }: Props) {
  return (
    <div
      className={cn(
        "marketing min-h-screen",
        marketingFont.variable,
        className
      )}
    >
      {children}
    </div>
  );
}
