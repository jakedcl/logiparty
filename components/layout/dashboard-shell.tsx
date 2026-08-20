"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
};

type Props = {
  orgName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  navItems: DashboardNavItem[];
  identity: React.ReactNode;
  signOut: React.ReactNode;
  children: React.ReactNode;
};

function navItemActive(pathname: string, href: string): boolean {
  const path = href.split("#")[0] ?? href;
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function Brand({
  orgName,
  logoUrl,
  compact = false,
}: {
  orgName: string;
  logoUrl?: string | null;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", compact && "gap-1.5")}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className={cn(
            "w-auto shrink-0",
            compact ? "h-7 max-w-[100px]" : "h-8 max-w-[140px]"
          )}
        />
      ) : null}
      <span
        className={cn(
          "font-semibold tracking-tight truncate text-neutral-900",
          compact ? "text-base" : "text-lg"
        )}
      >
        {orgName}
      </span>
    </div>
  );
}

function NavLinks({
  items,
  pathname,
  primaryColor,
  onNavigate,
}: {
  items: DashboardNavItem[];
  pathname: string;
  primaryColor: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Dashboard">
      {items.map((item) => {
        const active = navItemActive(pathname, item.href);
        return (
          <Link
            key={`${item.href}:${item.label}`}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-neutral-100 font-medium text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            )}
            style={
              active
                ? { boxShadow: `inset 3px 0 0 ${primaryColor}` }
                : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  orgName,
  logoUrl,
  primaryColor = "#2563eb",
  navItems,
  identity,
  signOut,
  children,
}: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside
        className="no-print fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-neutral-200 bg-white lg:flex"
        style={{ borderTop: `3px solid ${primaryColor}` }}
      >
        <div className="border-b border-neutral-100 px-4 py-4">
          <Brand orgName={orgName} logoUrl={logoUrl} />
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks
            items={navItems}
            pathname={pathname}
            primaryColor={primaryColor}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-900/40"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-white shadow-lg"
            style={{ borderTop: `3px solid ${primaryColor}` }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <Brand orgName={orgName} logoUrl={logoUrl} compact />
              <button
                type="button"
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <NavLinks
                items={navItems}
                pathname={pathname}
                primaryColor={primaryColor}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <header
          className="no-print sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-4"
          style={{ borderBottomColor: `${primaryColor}33` }}
        >
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              className="shrink-0 rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <Brand orgName={orgName} logoUrl={logoUrl} compact />
          </div>
          <div className="hidden lg:block" />
          <div className="flex shrink-0 items-center gap-3">
            {identity}
            {signOut}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
