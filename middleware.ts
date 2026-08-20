import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getOrgSlugFromHost } from "@/lib/org/subdomain";

/** Same-host redirect — never bounce to AUTH_URL apex. */
function redirectPath(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const orgSlug = getOrgSlugFromHost(host);
  const { pathname } = request.nextUrl;

  // Auth.js sets `__Secure-authjs.session-token` when useSecureCookies is on.
  // getToken defaults secureCookie=false and looks for the wrong cookie → null
  // token → /dashboard↔/login loop while auth() still sees the session.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const requestHeaders = new Headers(request.headers);
  // Only middleware may set tenant context (ignore client-supplied values).
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
    pathname.startsWith("/api/auth") || pathname === "/api/health";
  // Apex marketing homepage (A3) — public when host has no org slug.
  const isApexMarketing = !orgSlug && pathname === "/";

  if (
    !token &&
    !isAuthPage &&
    !isInvitePage &&
    !isPublicApi &&
    !isApexMarketing
  ) {
    return redirectPath(request, "/login");
  }

  if (token && isAuthPage) {
    const isClient = token.isClient === true;
    // On apex, leave /login alone for the "use your subdomain" message unless
    // they somehow have a session cookie here — then send them to the tenant.
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
