import { headers } from "next/headers";
import { signOut } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import type { Session } from "next-auth";
import { DevRoleSwitchPanel } from "@/components/dev/dev-role-switch-panel";
import { OrgTheme } from "@/components/layout/org-theme";
import { PortalGlobalSearch } from "@/components/search/portal-global-search";
import { PortalNav } from "@/components/layout/portal-nav";
import { SessionIdentity } from "@/components/layout/session-identity";
import { WindowToolbar } from "@/components/ui/window-chrome";
import { FALLBACK_PRIMARY_COLOR } from "@/lib/theme/primary-color";

type Props = {
  session: Session;
  primaryColor?: string;
  logoUrl?: string | null;
  companyName?: string | null;
  children: React.ReactNode;
};

async function signOutAction() {
  "use server";
  const headersList = await headers();
  await signOut({
    redirectTo: absoluteRedirectUrl(headersList, "/login"),
  });
}

export function PortalShell({
  session,
  primaryColor = FALLBACK_PRIMARY_COLOR,
  logoUrl,
  companyName,
  children,
}: Props) {
  const orgName = session.user.orgName;

  return (
    <OrgTheme primaryColor={primaryColor} className="flex flex-col">
      <WindowToolbar as="header" className="shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-8 w-auto max-w-[120px]" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight text-[var(--lp-fg)]">
                {orgName}
              </p>
              {companyName ? (
                <p className="truncate text-xs text-[var(--lp-muted)]">
                  {companyName}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PortalGlobalSearch />
            <SessionIdentity
              name={session.user.name}
              email={session.user.email}
              isOrgAdmin={session.user.isOrgAdmin}
              isManager={session.user.isManager}
              isStaff={session.user.isStaff}
              isClient={session.user.isClient}
              profileHref="/portal/profile"
              signOutAction={signOutAction}
            />
          </div>
        </div>
        <div className="mx-auto hidden max-w-3xl px-4 pb-3.5 sm:block md:px-6">
          <PortalNav />
        </div>
      </WindowToolbar>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 sm:pb-8">
        {children}
      </main>

      <WindowToolbar
        as="nav"
        className="fixed inset-x-0 bottom-0 z-10 border-t sm:hidden"
        aria-label="Portal navigation"
      >
        <div className="mx-auto max-w-3xl px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          <PortalNav />
        </div>
      </WindowToolbar>
      <DevRoleSwitchPanel />
    </OrgTheme>
  );
}
