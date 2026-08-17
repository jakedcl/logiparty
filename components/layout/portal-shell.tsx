import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { Session } from "next-auth";

type Props = {
  session: Session;
  primaryColor?: string;
  logoUrl?: string | null;
  companyName?: string | null;
  children: React.ReactNode;
};

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
        className="border-b bg-white px-4 py-3 flex items-center justify-between"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="flex items-center gap-6 min-w-0">
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
          <nav className="hidden sm:flex gap-4 text-sm text-neutral-600">
            <Link href="/portal" className="hover:text-neutral-900">
              Home
            </Link>
            <Link href="/portal/jobs" className="hover:text-neutral-900">
              Jobs
            </Link>
            <Link href="/portal/inventory" className="hover:text-neutral-900">
              Inventory
            </Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav className="sm:hidden flex gap-4 text-sm text-neutral-600 px-4 py-2 border-b bg-white">
        <Link href="/portal" className="hover:text-neutral-900">
          Home
        </Link>
        <Link href="/portal/jobs" className="hover:text-neutral-900">
          Jobs
        </Link>
        <Link href="/portal/inventory" className="hover:text-neutral-900">
          Inventory
        </Link>
      </nav>

      <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
