import type { Metadata } from "next";
import { getMarketingOrigin, MARKETING_DESCRIPTION } from "@/lib/marketing/site";

export const metadata: Metadata = {
  metadataBase: new URL(getMarketingOrigin()),
  title: {
    default: "Logiparty",
    template: "%s — Logiparty",
  },
  description: MARKETING_DESCRIPTION,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
