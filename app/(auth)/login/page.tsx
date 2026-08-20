import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signIn } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";
import { OrgTheme } from "@/components/layout/org-theme";
import {
  FALLBACK_PRIMARY_COLOR,
  resolvePrimaryColor,
} from "@/lib/theme/primary-color";

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="w-full max-w-sm">
          <h1 className="lp-page-title mb-2">Sign in</h1>
          <p className="lp-page-sub">
            Open your organization subdomain to sign in (for example{" "}
            <code className="rounded bg-[var(--surface-hover)] px-1 text-xs">
              your-org.logiparty.com
            </code>
            , or locally{" "}
            <code className="rounded bg-[var(--surface-hover)] px-1 text-xs">
              your-org.localhost:3000
            </code>
            ).
          </p>
          <p className="mt-6 text-sm text-[var(--muted)]">
            <Link
              href="/"
              className="font-medium text-[var(--foreground)] underline underline-offset-2"
            >
              ← Back to Logiparty
            </Link>
          </p>
        </div>
      </div>
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
      <div className="relative flex min-h-screen flex-col justify-center px-4 py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 15% 10%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 55%),
              radial-gradient(ellipse 50% 40% at 90% 80%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 50%)
            `,
          }}
        />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-start gap-4">
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt=""
                className="h-11 w-auto max-w-[180px]"
              />
            ) : null}
            <div>
              <h1 className="lp-page-title">{orgName}</h1>
              <p className="lp-page-sub">Sign in to continue</p>
            </div>
          </div>
          {params.error ? (
            <p className="mb-4 text-sm font-medium text-[var(--danger)]">
              Invalid email or password.
            </p>
          ) : null}
          <form
            action={async (formData) => {
              "use server";
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              try {
                const reqHeaders = await headers();
                // Absolute URL keeps post-login on tenant subdomain (AUTH_URL is apex).
                await signIn("credentials", {
                  email,
                  password,
                  orgSlug,
                  redirectTo: absoluteRedirectUrl(reqHeaders, "/"),
                });
              } catch (error) {
                // Auth.js throws a redirect on success — rethrow so it isn't treated as failure.
                if (
                  typeof error === "object" &&
                  error &&
                  "digest" in error &&
                  String((error as { digest?: string }).digest).startsWith(
                    "NEXT_REDIRECT"
                  )
                ) {
                  throw error;
                }
                redirect("/login?error=1");
              }
            }}
            className="space-y-4 border-t border-[var(--border)] pt-6"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
              >
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
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="lp-input"
              />
            </div>
            <button type="submit" className="lp-btn w-full py-2.5">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </OrgTheme>
  );
}
