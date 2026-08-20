"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { OrgTheme } from "@/components/layout/org-theme";
import { cn } from "@/lib/utils";
import { FALLBACK_PRIMARY_COLOR } from "@/lib/theme/primary-color";

export type DashboardNavChild = {
  href: string;
  label: string;
  /** Query match for active child (e.g. tab=client on inventory hub). */
  tab?: string;
};

export type DashboardNavItem = {
  href: string;
  label: string;
  children?: DashboardNavChild[];
};

type Props = {
  orgName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  navItems: DashboardNavItem[];
  /** Name/role control (dropdown with profile + sign out) */
  accountMenu: React.ReactNode;
  children: React.ReactNode;
};

function pathOnly(href: string): string {
  return href.split("?")[0]?.split("#")[0] ?? href;
}

function navItemActive(pathname: string, href: string): boolean {
  const path = pathOnly(href);
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function childActive(
  pathname: string,
  searchParams: URLSearchParams,
  child: DashboardNavChild,
  siblings: readonly DashboardNavChild[]
): boolean {
  if (!navItemActive(pathname, child.href)) return false;
  if (!child.tab) return true;
  const current = searchParams.get("tab");
  if (current === child.tab) return true;
  // Default tab when ?tab= missing: first sibling with a tab
  if (!current) {
    const first = siblings.find((s) => s.tab)?.tab;
    return first === child.tab;
  }
  return false;
}

function Brand({
  orgName,
  logoUrl,
  /** Horizontal beside logo — only for the sticky mobile top bar */
  inline = false,
  onInk = false,
}: {
  orgName: string;
  logoUrl?: string | null;
  inline?: boolean;
  onInk?: boolean;
}) {
  const nameClass = onInk
    ? "text-[var(--sidebar-fg)]"
    : "text-[var(--foreground)]";

  if (inline) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-7 w-auto max-w-[100px] shrink-0"
          />
        ) : null}
        <span
          className={cn(
            "truncate text-base font-semibold tracking-tight",
            nameClass
          )}
        >
          {orgName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2.5">
      {logoUrl ? (
        <div className="rounded-md bg-white px-2 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            className="h-8 w-auto max-w-[140px] shrink-0"
          />
        </div>
      ) : null}
      <span
        className={cn(
          "whitespace-normal break-words text-balance text-[0.9375rem] font-semibold leading-snug tracking-tight",
          nameClass
        )}
      >
        {orgName}
      </span>
    </div>
  );
}

function linkClass(active: boolean, nested = false) {
  return cn(
    "relative rounded-md text-sm transition-colors",
    nested ? "px-3 py-1.5" : "px-3 py-2",
    active
      ? "bg-[var(--sidebar-active)] font-medium text-[var(--sidebar-fg)]"
      : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
  );
}

function ActiveBar({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--primary)]"
      aria-hidden
    />
  );
}

function NavGroup({
  item,
  pathname,
  searchParams,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  searchParams: URLSearchParams;
  onNavigate?: () => void;
}) {
  const children = item.children ?? [];
  const sectionActive = navItemActive(pathname, item.href);
  const anyChildActive = children.some((c) =>
    childActive(pathname, searchParams, c, children)
  );
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive, pathname]);

  if (children.length === 0) {
    const active = sectionActive;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={linkClass(active)}
      >
        <ActiveBar show={active} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          linkClass(sectionActive && !anyChildActive),
          "flex w-full items-center justify-between gap-2 text-left"
        )}
      >
        <ActiveBar show={sectionActive && !anyChildActive} />
        <span>{item.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform",
            open ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="ml-2 flex flex-col gap-0.5 border-l border-white/10 pl-1.5"
          role="group"
          aria-label={item.label}
        >
          {children.map((child) => {
            const active = childActive(
              pathname,
              searchParams,
              child,
              children
            );
            return (
              <Link
                key={`${child.href}:${child.label}`}
                href={child.href}
                onClick={onNavigate}
                className={linkClass(active, true)}
                aria-current={active ? "page" : undefined}
              >
                <ActiveBar show={active} />
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function NavLinksInner({
  items,
  pathname,
  onNavigate,
}: {
  items: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Dashboard">
      {items.map((item) => (
        <NavGroup
          key={`${item.href}:${item.label}`}
          item={item}
          pathname={pathname}
          searchParams={searchParams}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function NavLinks(props: {
  items: DashboardNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <Suspense
      fallback={
        <nav className="flex flex-col gap-0.5 px-2" aria-label="Dashboard">
          {props.items.map((item) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              onClick={props.onNavigate}
              className={linkClass(navItemActive(props.pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      }
    >
      <NavLinksInner {...props} />
    </Suspense>
  );
}

export function DashboardShell({
  orgName,
  logoUrl,
  primaryColor = FALLBACK_PRIMARY_COLOR,
  navItems,
  accountMenu,
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
    <OrgTheme primaryColor={primaryColor}>
      {/* Desktop sidebar — ink chrome, brand accent */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-[var(--sidebar)] lg:flex">
        <div className="h-[3px] shrink-0 bg-[var(--primary)]" aria-hidden />
        <div className="border-b border-white/10 px-4 py-5">
          <Brand orgName={orgName} logoUrl={logoUrl} onInk />
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks items={navItems} pathname={pathname} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--foreground)]/50"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-[var(--sidebar)]"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="h-[3px] shrink-0 bg-[var(--primary)]" aria-hidden />
            <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-4">
              <Brand orgName={orgName} logoUrl={logoUrl} onInk />
              <button
                type="button"
                className="shrink-0 rounded-md p-2 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
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
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <header className="no-print sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-3 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] sm:px-5">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              className="shrink-0 rounded-md p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <Brand orgName={orgName} logoUrl={logoUrl} inline />
          </div>
          <div className="hidden lg:block" />
          <div className="flex shrink-0 items-center">{accountMenu}</div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </OrgTheme>
  );
}
