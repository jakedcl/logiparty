import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { orgExistsBySlug } from "@/lib/org/exists";
import {
  buildApexOrigin,
  getOrgSlugFromHost,
  portFromHost,
} from "@/lib/org/subdomain";

/** Same-host redirect — never bounce to AUTH_URL apex. */
function redirectPath(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url);
}

/** Unknown tenant subdomain → marketing apex (A4). */
function redirectToApex(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const apex = buildApexOrigin(portFromHost(host));
  return NextResponse.redirect(new URL("/", apex));
}

function isMetadataPath(pathname: string): boolean {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/og.png"
  );
}

/** Public marketing routes on apex (unknown paths fall through to app 404). */
function isApexPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    isMetadataPath(pathname)
  );
}

function isProtectedAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth") &&
      pathname !== "/api/health" &&
      pathname !== "/api/stripe/webhook")
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const orgSlug = getOrgSlugFromHost(host);
  const { pathname } = request.nextUrl;

  // A4: host resolved to a slug but no organizations row → apex homepage.
  // Fail open on DB errors / missing DATABASE_URL so real tenants keep working.
  // Skip redirect when apex would still resolve to the same slug (e.g. bad
  // NEXT_PUBLIC_DEV_ORG_SLUG on bare localhost) to avoid a loop.
  if (orgSlug) {
    const exists = await orgExistsBySlug(orgSlug);
    if (exists === false) {
      const apexHost = new URL(
        buildApexOrigin(portFromHost(host))
      ).host;
      if (getOrgSlugFromHost(apexHost) !== orgSlug) {
        return redirectToApex(request);
      }
    }
  }

  // Auth.js sets `__Secure-authjs.session-token` when useSecureCookies is on.
  // getToken defaults secureCookie=false and looks for the wrong cookie → null
  // token → /dashboard↔/login loop while auth() still sees the session.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const requestHeaders = new Headers(request.headers);
  // Only proxy may set tenant context (ignore client-supplied values).
  requestHeaders.delete("x-org-slug");
  // Prefer host slug; fall back to JWT orgSlug (authenticated routes must not
  // require the host to resolve an org when the session already has one).
  const tenantSlug =
    orgSlug ?? (token?.orgSlug ? String(token.orgSlug) : null);
  if (tenantSlug) {
    requestHeaders.set("x-org-slug", tenantSlug);
  }

  const isAuthPage = pathname === "/login";
  const isInvitePage = pathname.startsWith("/invite/");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/api/stripe/webhook";
  const isDemoPage = pathname === "/demo" || pathname.startsWith("/demo/");

  if (!token && !isInvitePage && !isPublicApi && !isMetadataPath(pathname)) {
    if (orgSlug) {
      if (!isAuthPage && !isDemoPage) {
        return redirectPath(request, "/login");
      }
    } else if (isProtectedAppRoute(pathname)) {
      return redirectPath(request, "/login");
    } else if (!isApexPublicPath(pathname)) {
      // Unknown apex path — allow through so Next.js serves not-found.
    }
  }

  if (orgSlug && pathname === "/") {
    if (token) {
      const isClient = token.isClient === true;
      return redirectPath(request, isClient ? "/portal" : "/dashboard");
    }
    return redirectPath(request, "/login");
  }

  if (token && isAuthPage) {
    const isClient = token.isClient === true;
    // On apex, leave /login alone for the org picker unless they have a session
    // cookie here — then send them to the tenant.
    if (orgSlug) {
      return redirectPath(request, isClient ? "/portal" : "/dashboard");
    }
  }

  if (token && pathname.startsWith("/dashboard")) {
    const canInternal =
      token.isOrgAdmin === true ||
      token.isManager === true ||
      token.isStaff === true;
    if (!canInternal) {
      // Clients only — avoid dashboard↔portal ping-pong when flags are missing.
      if (token.isClient === true) {
        return redirectPath(request, "/portal");
      }
    }
  }

  if (token && pathname.startsWith("/portal")) {
    if (token.isClient !== true) {
      return redirectPath(request, "/dashboard");
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
