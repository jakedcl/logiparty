import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signIn } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { getMarketingOrigin } from "@/lib/marketing/site";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";
import { OrgTheme } from "@/components/layout/org-theme";
import { LogipartyLogo } from "@/components/brand/logiparty-logo";
import { MarketingRoot } from "@/components/marketing/marketing-root";
import { TenantLoginPicker } from "@/components/marketing/tenant-login-picker";
import { Button } from "@/components/ui/button";
import {
  FALLBACK_PRIMARY_COLOR,
  resolvePrimaryColor,
} from "@/lib/theme/primary-color";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const orgSlug = getOrgSlugFromHeaders(headersList);

  if (!orgSlug) {
    const meta = marketingMetadata({
      title: "Sign in — Logiparty",
      description:
        "Sign in to your Logiparty workspace on your organization subdomain.",
      path: "/login",
    });
    const og = `${getMarketingOrigin()}/og.png`;
    return {
      ...meta,
      openGraph: {
        ...meta.openGraph,
        images: [
          {
            url: og,
            width: 1200,
            height: 630,
            alt: "Logiparty — event logistics operations for 3PLs",
          },
        ],
      },
      twitter: {
        ...meta.twitter,
        images: [og],
      },
    };
  }

  return {
    title: "Sign in",
    description: "Sign in to your organization workspace",
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; missingOrg?: string }>;
}) {
  const headersList = await headers();
  const session = await auth();
  if (session?.user) {
    // Absolute URL keeps redirect on tenant host (AUTH_URL is apex).
    redirect(absoluteRedirectUrl(headersList, postAuthPath(session.user)));
  }

  const orgSlug = getOrgSlugFromHeaders(headersList);

  const params = await searchParams;

  if (!orgSlug) {
    return (
      <MarketingRoot>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <div className="lp-surface lp-enter w-full max-w-md p-6 sm:p-7">
            <div className="mb-6">
              <LogipartyLogo href="/" markSize={32} />
            </div>
            <h1 className="lp-page-title mb-2">Sign in to your workspace</h1>
            <p className="lp-page-sub">
              Your team has its own workspace — for example{" "}
              <span className="font-medium text-[var(--foreground)]">
                your-org.logiparty.com
              </span>
              . Enter your workspace name to continue.
            </p>
            {params.error ? (
              <p className="mb-4 text-sm font-bold text-[var(--danger)]">
                Invalid email or password.
              </p>
            ) : null}
            <TenantLoginPicker />
            <p className="mt-6 text-sm text-[var(--muted)]">
              No account yet?{" "}
              <Link href="/#request" className="app-link">
                Request access
              </Link>
              {" · "}
              <Link href="/" className="app-link">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </MarketingRoot>
    );
  }

  let org: {
    name: string;
    primaryColor: string | null;
    logoUrl: string | null;
  } | null = null;

  if (db) {
    const [row] = await db
      .select({
        name: organizations.name,
        primaryColor: organizations.primaryColor,
        logoUrl: organizations.logoUrl,
      })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    org = row ?? null;
  }

  const orgName = org?.name ?? orgSlug;
  const primaryColor = resolvePrimaryColor(
    org?.primaryColor ?? FALLBACK_PRIMARY_COLOR
  );

  return (
    <OrgTheme primaryColor={primaryColor}>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="lp-surface lp-enter w-full max-w-sm p-6 sm:p-7">
          <div className="mb-6 flex flex-col items-start gap-4">
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={org?.name ?? "Organization"}
                className="h-11 w-auto max-w-[180px]"
              />
            ) : null}
            <div>
              <h1 className="lp-page-title">{orgName}</h1>
              <p className="lp-page-sub">Sign in to continue</p>
            </div>
          </div>
          {params.error ? (
            <p className="mb-4 text-sm font-bold text-[var(--danger)]">
              Invalid email or password.
            </p>
          ) : null}
          <form
            action={async (formData) => {
              "use server";
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              const reqHeaders = await headers();
              // redirect: false — Auth.js otherwise sends relative /login to AUTH_URL (apex).
              const result = await signIn("credentials", {
                email,
                password,
                orgSlug,
                redirect: false,
              });
              if (result?.error) {
                redirect(absoluteRedirectUrl(reqHeaders, "/login?error=1"));
              }
              const session = await auth();
              if (!session?.user) {
                redirect(absoluteRedirectUrl(reqHeaders, "/login?error=1"));
              }
              redirect(
                absoluteRedirectUrl(reqHeaders, postAuthPath(session.user))
              );
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="app-label mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="lp-input"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="app-label">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm app-link">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="lp-input"
              />
            </div>
            <Button type="submit" className="w-full py-2.5">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </OrgTheme>
  );
}
