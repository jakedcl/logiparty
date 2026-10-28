import type { MetadataRoute } from "next";
import { getMarketingOrigin } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getMarketingOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/portal/", "/invite/", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
