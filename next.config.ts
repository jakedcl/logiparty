import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    const marketingCache = {
      key: "Cache-Control",
      value: "public, s-maxage=3600, stale-while-revalidate=86400",
    };
    return [
      {
        source: "/",
        headers: [...securityHeaders, marketingCache],
      },
      {
        source: "/demo",
        headers: [...securityHeaders, marketingCache],
      },
      {
        source: "/pricing",
        headers: [...securityHeaders, marketingCache],
      },
      {
        source: "/privacy",
        headers: [...securityHeaders, marketingCache],
      },
      {
        source: "/terms",
        headers: [...securityHeaders, marketingCache],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
