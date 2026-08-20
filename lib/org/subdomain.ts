/**
 * Resolve org slug from Host header.
 * Production: nydac.logiparty.com → nydac
 * Local: nydac.localhost → nydac
 */

export function getRootDomain(): string {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  if (!configured) return "logiparty.com";
  // Tolerate https://logiparty.com or www.logiparty.com misconfig in Vercel env.
  return configured
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
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

/** Absolute origin for a tenant subdomain (local or prod). */
export function buildTenantOrigin(orgSlug: string, port = "3000"): string {
  const root = getRootDomain();
  if (process.env.NODE_ENV === "development") {
    return `http://${orgSlug}.localhost:${port}`;
  }
  return `https://${orgSlug}.${root}`;
}

/** Apex marketing origin (no tenant slug). Local keeps request port when given. */
export function buildApexOrigin(port = "3000"): string {
  const root = getRootDomain();
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${port}`;
  }
  return `https://${root}`;
}

/** Port from Host header (`fake.localhost:3000` → `3000`), else default. */
export function portFromHost(host: string, fallback = "3000"): string {
  const parts = host.split(":");
  return parts.length > 1 && parts[1] ? parts[1] : fallback;
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
