import type { Metadata } from "next";
import { getMarketingOrigin, MARKETING_DESCRIPTION } from "@/lib/marketing/site";

type MarketingMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function marketingMetadata({
  title,
  description = MARKETING_DESCRIPTION,
  path = "/",
  noIndex = false,
}: MarketingMetadataOptions): Metadata {
  const origin = getMarketingOrigin();
  const url = `${origin}${path === "/" ? "" : path}`;
  const ogImage = `${origin}/og.png`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Logiparty",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Logiparty dashboard" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
