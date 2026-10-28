import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata = marketingMetadata({
  title: "Logiparty — Ops software for event logistics 3PLs",
  path: "/",
});

/** Apex marketing homepage (tenant `/` redirects in proxy.ts). */
export const revalidate = 3600;

export default function HomePage() {
  return <MarketingHome />;
}
