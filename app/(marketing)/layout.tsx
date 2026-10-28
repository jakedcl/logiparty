import type { Metadata } from "next";
import { getMarketingOrigin, MARKETING_DESCRIPTION } from "@/lib/marketing/site";

export const metadata: Metadata = {
  metadataBase: new URL(getMarketingOrigin()),
  title: {
    default: "Logiparty",
    template: "%s — Logiparty",
  },
  description: MARKETING_DESCRIPTION,
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
