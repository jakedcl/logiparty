import Link from "next/link";
import { OrgTheme } from "@/components/layout/org-theme";
import { getOrgBySlugFromHeaders } from "@/lib/org/from-headers";
import { resolvePrimaryColor } from "@/lib/theme/primary-color";

export async function TenantNotFound() {
  const org = await getOrgBySlugFromHeaders();
  const orgName = org?.name?.trim() || "Organization";
  const primaryColor = resolvePrimaryColor(org?.primaryColor);
  const logoUrl = org?.logoUrl;
  const homeHref = "/";

  return (
    <OrgTheme primaryColor={primaryColor}>
      <div className="lp-app flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={orgName}
            className="mb-6 h-12 w-auto max-w-[200px] object-contain"
          />
        ) : (
          <p className="mb-4 text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {orgName}
          </p>
        )}
        <p className="text-sm font-semibold text-[var(--primary)]">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          That link is not valid in your {orgName} workspace. Head back to your
          dashboard to continue.
        </p>
        <Link
          href={homeHref}
          className="mt-8 inline-flex rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Back to dashboard
        </Link>
      </div>
    </OrgTheme>
  );
}
