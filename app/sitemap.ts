import type { MetadataRoute } from "next";
import { getMarketingOrigin } from "@/lib/marketing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getMarketingOrigin();
  const lastModified = new Date("2026-10-26");

  return [
    { url: origin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/demo`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/pricing`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
