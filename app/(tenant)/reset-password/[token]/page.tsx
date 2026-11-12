import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { completePasswordReset } from "@/lib/actions/password-reset";
import { isPasswordResetTokenActive } from "@/lib/auth/password-reset-url";
import { signIn } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, passwordResetTokens } from "@/lib/db/schema";
import { OrgTheme } from "@/components/layout/org-theme";
import { Button } from "@/components/ui/button";
import { resolvePrimaryColor } from "@/lib/theme/primary-color";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="lp-surface max-w-sm p-6 text-sm text-[var(--muted)]">
          Database not configured.
        </p>
      </div>
    );
  }

  const [row] = await db
    .select({
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      orgId: passwordResetTokens.orgId,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  const valid = row && isPasswordResetTokenActive(row);

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="lp-surface lp-enter max-w-sm p-6 text-sm text-[var(--muted)]">
          <p className="mb-4">This reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="app-link">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, row.orgId))
    .limit(1);

  return (
    <OrgTheme primaryColor={resolvePrimaryColor(org?.primaryColor)}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="lp-surface lp-enter w-full max-w-sm p-6">
          <h1 className="lp-page-title mb-1">{org?.name ?? "Organization"}</h1>
          <p className="lp-page-sub mb-6">Choose a new password</p>
          <form
            action={async (formData) => {
              "use server";
              formData.set("token", token);
              const result = await completePasswordReset(formData);
              const headersList = await headers();
              await signIn("credentials", {
                email: result.email,
                password: formData.get("password") as string,
                orgSlug: result.orgSlug,
                redirect: false,
              });
              const session = await auth();
              const dest = session?.user
                ? postAuthPath(session.user)
                : "/login";
              const { redirect } = await import("next/navigation");
              redirect(absoluteRedirectUrl(headersList, dest));
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="password" className="app-label mb-1">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="lp-input"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="app-label mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="lp-input"
              />
            </div>
            <Button type="submit" className="w-full py-2">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </OrgTheme>
  );
}
