import type { Session } from "next-auth";
import { getRootDomain } from "@/lib/org/subdomain";
import { getRequestOrigin } from "@/lib/auth/request-origin";

/** Where to send a signed-in user after auth. */
export function postAuthPath(user: Session["user"]): "/portal" | "/dashboard" {
  return user.isClient ? "/portal" : "/dashboard";
}

/** Absolute redirect URL on the same host as the incoming request. */
export function absoluteRedirectUrl(
  headersList: Headers,
  path: string
): string {
  const origin = getRequestOrigin(headersList);
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function isAllowedRedirectHost(hostname: string): boolean {
  const root = getRootDomain();
  const host = hostname.toLowerCase();
  return (
    host === root ||
    host === `www.${root}` ||
    host.endsWith(`.${root}`) ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1"
  );
}

/**
 * Auth.js redirect callback — allow tenant subdomains, not just AUTH_URL apex.
 * Relative paths still fall back to baseUrl; callers should pass absolute URLs.
 */
export function authRedirectCallback({
  url,
  baseUrl,
}: {
  url: string;
  baseUrl: string;
}): string {
  if (url.startsWith("/")) return `${baseUrl}${url}`;

  try {
    const parsed = new URL(url);
    if (isAllowedRedirectHost(parsed.hostname)) return url;
  } catch {
    // ignore invalid URLs
  }

  return baseUrl;
}
