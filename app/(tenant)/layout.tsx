import type { Metadata } from "next";
import { headers } from "next/headers";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const orgSlug = getOrgSlugFromHeaders(headersList);
  if (orgSlug) {
    return {
      robots: { index: false, follow: false },
    };
  }
  return {};
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
