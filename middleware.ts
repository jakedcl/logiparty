import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getOrgSlugFromHost } from "@/lib/org/subdomain";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const orgSlug = getOrgSlugFromHost(host);
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  // Only middleware may set tenant context (ignore client-supplied values).
  requestHeaders.delete("x-org-slug");
  if (orgSlug) {
    requestHeaders.set("x-org-slug", orgSlug);
  }

  const isAuthPage = pathname === "/login";
  const isInvitePage = pathname.startsWith("/invite/");
  const isPublicApi =
    pathname.startsWith("/api/auth") || pathname === "/api/health";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token && !isAuthPage && !isInvitePage && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    const isClient = token.isClient === true;
    return NextResponse.redirect(
      new URL(isClient ? "/portal" : "/dashboard", request.url)
    );
  }

  // Apex / unknown host: still allow login UI, but API + app routes need an org slug.
  if (!orgSlug && !isAuthPage && !isInvitePage && !isPublicApi) {
    const isLocalBare =
      host.split(":")[0] === "localhost" || host.split(":")[0] === "127.0.0.1";
    if (!isLocalBare && !process.env.NEXT_PUBLIC_DEV_ORG_SLUG) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (token && pathname.startsWith("/dashboard")) {
    const canInternal =
      token.isOrgAdmin || token.isManager || token.isStaff;
    if (!canInternal) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  if (token && pathname.startsWith("/portal")) {
    if (!token.isClient) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
