/**
 * Resolve org slug from Host header.
 * Production: testtenant.logiparty.com → testtenant
 * Local: testtenant.localhost → testtenant
 */

function getRootDomain(): string {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  if (!configured) return "logiparty.com";
  // Tolerate www.logiparty.com misconfig in Vercel env.
  return configured.replace(/^www\./, "").toLowerCase();
}

export function getOrgSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  const rootDomain = getRootDomain();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_DEV_ORG_SLUG ?? null;
  }

  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }

  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return null;
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    const slug = hostname.slice(0, -(rootDomain.length + 1));
    if (slug && slug !== "www" && slug !== "app") return slug;
  }

  return null;
}

/** Prefer slug injected by middleware; fall back to Host / x-forwarded-host. */
export function getOrgSlugFromHeaders(headersList: Headers): string | null {
  const fromMiddleware = headersList.get("x-org-slug")?.trim();
  if (fromMiddleware) return fromMiddleware;

  const host =
    headersList.get("host") ??
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    "";

  return (
    getOrgSlugFromHost(host) ?? process.env.NEXT_PUBLIC_DEV_ORG_SLUG ?? null
  );
}
