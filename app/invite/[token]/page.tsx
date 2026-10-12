import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { invites, organizations } from "@/lib/db/schema";
import { acceptInvite } from "@/lib/actions/invites";
import { signIn } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import { OrgTheme } from "@/components/layout/org-theme";
import { Button } from "@/components/ui/button";
import { resolvePrimaryColor } from "@/lib/theme/primary-color";

export default async function InviteAcceptPage({
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

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite || invite.acceptedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="lp-surface lp-enter max-w-sm p-6 text-sm text-[var(--muted)]">
          This invitation is invalid or expired.
        </p>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, invite.orgId))
    .limit(1);

  return (
    <OrgTheme primaryColor={resolvePrimaryColor(org?.primaryColor)}>
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="lp-surface lp-enter w-full max-w-sm p-6">
        <h1 className="lp-page-title mb-1">{org?.name ?? "Organization"}</h1>
        <p className="lp-page-sub mb-6">
          Complete your account for {invite.email}
        </p>
        <form
          action={async (formData) => {
            "use server";
            formData.set("token", token);
            const result = await acceptInvite(formData);
            const [orgRow] = await db!
              .select({ slug: organizations.slug })
              .from(organizations)
              .where(eq(organizations.id, result.orgId))
              .limit(1);
            const headersList = await headers();
            const dest = invite.isClient ? "/portal" : "/dashboard";
            await signIn("credentials", {
              email: result.email,
              password: formData.get("password") as string,
              orgSlug: orgRow?.slug ?? "nydac",
              redirectTo: absoluteRedirectUrl(headersList, dest),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="firstName" className="app-label mb-1">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                className="lp-input"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="app-label mb-1">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                className="lp-input"
              />
            </div>
          </div>
          {invite.isClient && (
            <div>
              <label htmlFor="title" className="app-label mb-1">
                Job title
              </label>
              <input id="title" name="title" className="lp-input" />
            </div>
          )}
          <div>
            <label htmlFor="password" className="app-label mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="lp-input"
            />
          </div>
          <Button type="submit" className="w-full py-2">
            Create account
          </Button>
        </form>
      </div>
    </div>
    </OrgTheme>
  );
}
