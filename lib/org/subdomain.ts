/**
 * Resolve org slug from Host header.
 * Production: acme.logiparty.com → acme
 * Local: acme.localhost → acme
 */
export function getOrgSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "logiparty.com"
  ).toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_DEV_ORG_SLUG ?? null;
  }

  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    const slug = hostname.replace(`.${rootDomain}`, "");
    if (slug && slug !== "www" && slug !== "app") return slug;
  }

  return null;
}
