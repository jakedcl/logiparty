import Link from "next/link";
import { headers } from "next/headers";
import { signOut } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import type { Session } from "next-auth";
import { DevRoleSwitchPanel } from "@/components/dev/dev-role-switch-panel";
import { SessionIdentity } from "@/components/layout/session-identity";

type Props = {
  session: Session;
  primaryColor?: string;
  logoUrl?: string | null;
  companyName?: string | null;
  children: React.ReactNode;
};

const NAV = [
  { href: "/portal", label: "Home" },
  { href: "/portal/jobs", label: "Jobs" },
  { href: "/portal/inventory", label: "Inventory" },
  { href: "/portal/notes", label: "Notes" },
] as const;

async function signOutAction() {
  "use server";
  const headersList = await headers();
  await signOut({
    redirectTo: absoluteRedirectUrl(headersList, "/login"),
  });
}

export function PortalShell({
  session,
  primaryColor = "#2563eb",
  logoUrl,
  companyName,
  children,
}: Props) {
  const orgName = session.user.orgName;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header
        className="border-b bg-white px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-auto max-w-[120px]" />
          ) : null}
          <div className="min-w-0">
            <p className="font-semibold text-lg tracking-tight truncate">
              {orgName}
            </p>
            {companyName ? (
              <p className="text-xs text-neutral-500 truncate">{companyName}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center shrink-0">
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
      </header>

      <nav className="hidden sm:flex gap-4 text-sm text-neutral-600 px-4 md:px-6 py-2 border-b bg-white max-w-3xl mx-auto w-full">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-neutral-900 py-1">
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full pb-24 sm:pb-6">
        {children}
      </main>

      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-10 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
        style={{ borderTopColor: primaryColor }}
        aria-label="Portal navigation"
      >
        <div className="flex justify-around items-stretch max-w-3xl mx-auto pb-[env(safe-area-inset-bottom,0px)]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 text-center py-3 text-sm font-medium text-neutral-600 active:bg-neutral-100 min-h-[48px] flex items-center justify-center"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <DevRoleSwitchPanel />
    </div>
  );
}
