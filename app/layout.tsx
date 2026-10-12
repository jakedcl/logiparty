import type { Metadata, Viewport } from "next";
import { marketingFont } from "@/components/marketing/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operations",
  description: "Logistics operations dashboard",
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
