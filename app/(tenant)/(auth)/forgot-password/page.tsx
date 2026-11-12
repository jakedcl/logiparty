import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";
import { OrgTheme } from "@/components/layout/org-theme";
import { Button } from "@/components/ui/button";
import {
  FALLBACK_PRIMARY_COLOR,
  resolvePrimaryColor,
} from "@/lib/theme/primary-color";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your workspace",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const headersList = await headers();
  const orgSlug = getOrgSlugFromHeaders(headersList);
  const params = await searchParams;

  if (!orgSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="lp-surface max-w-sm p-6 text-sm text-[var(--muted)]">
          Open your organization subdomain to reset a password — for example{" "}
          <span className="text-[var(--foreground)]">test.logiparty.com</span>.
        </p>
      </div>
    );
  }

  let orgName = orgSlug;
  let primaryColor = resolvePrimaryColor(FALLBACK_PRIMARY_COLOR);

  if (db) {
    const [row] = await db
      .select({
        name: organizations.name,
        primaryColor: organizations.primaryColor,
      })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    if (row) {
      orgName = row.name;
      primaryColor = resolvePrimaryColor(row.primaryColor ?? FALLBACK_PRIMARY_COLOR);
    }
  }

  return (
    <OrgTheme primaryColor={primaryColor}>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="lp-surface lp-enter w-full max-w-sm p-6 sm:p-7">
          <h1 className="lp-page-title">{orgName}</h1>
          <p className="lp-page-sub mb-6">Forgot your password?</p>
          {params.sent ? (
            <p className="mb-6 text-sm text-[var(--foreground)]">
              If an account exists for that email on this workspace, we sent
              reset instructions. Check your inbox (and spam). Links expire in
              one hour.
            </p>
          ) : null}
          <form
            action={async (formData) => {
              "use server";
              const email = formData.get("email") as string;
              await requestPasswordReset(orgSlug, email);
              const reqHeaders = await headers();
              const { redirect } = await import("next/navigation");
              redirect(
                absoluteRedirectUrl(reqHeaders, "/forgot-password?sent=1")
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
            <Button type="submit" className="w-full py-2.5">
              Send reset link
            </Button>
          </form>
          <p className="mt-6 text-sm text-[var(--muted)]">
            <Link href="/login" className="app-link">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </OrgTheme>
  );
}
