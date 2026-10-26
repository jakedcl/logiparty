import type { Metadata, Viewport } from "next";
import { marketingFont } from "@/components/marketing/fonts";
import { getMarketingOrigin, MARKETING_DESCRIPTION } from "@/lib/marketing/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getMarketingOrigin()),
  title: {
    default: "Logiparty",
    template: "%s — Logiparty",
  },
  description: MARKETING_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={marketingFont.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
