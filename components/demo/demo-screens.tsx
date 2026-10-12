"use client";

import { SegmentedControl } from "@/components/marketing/segmented-control";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { tenantThemeStyle } from "@/lib/theme/primary-color";
import {
  DEMO_CLIENTS,
  DEMO_CREW,
  DEMO_FLEET,
  DEMO_INVENTORY_CLIENT,
  DEMO_INVENTORY_ORG,
  DEMO_JOB_LINES,
  DEMO_JOBS,
  DEMO_MY_JOBS,
  DEMO_NEEDS,
  DEMO_ORG,
  DEMO_PORTAL_JOBS,
  DEMO_TEAM,
} from "@/lib/demo/scenario";
import type { DemoScreenId } from "@/lib/demo/steps";

function Shell({
  children,
  brand,
  nav,
  user,
  activeNav,
}: {
  children: React.ReactNode;
  brand: string;
  nav: string[];
  user: string;
  activeNav: string;
}) {
  return (
    <div
      className="lp-app flex h-full min-h-0"
      style={tenantThemeStyle(DEMO_ORG.primary)}
    >
      <aside className="app-sidebar hidden w-52 shrink-0 flex-col sm:flex">
        <div data-demo-hl="brand" className="border-b border-[var(--lp-line)] px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
            Workspace
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-snug">{brand}</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 text-xs">
          {nav.map((label) => (
            <span
              key={label}
              className={cn(
                "rounded-full border border-transparent px-2.5 py-2",
                label === activeNav
                  ? "app-nav-active"
                  : "text-[var(--sidebar-muted)]"
              )}
            >
              {label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="lp-window-head flex items-center justify-between px-5 py-3">
          <p
            data-demo-hl="brand"
            className="text-xs font-medium text-[var(--lp-muted)] sm:hidden"
          >
            {brand}
          </p>
          <p className="ml-auto text-xs text-[var(--lp-muted)]">{user}</p>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Table({
  headers,
  rows,
  hlKey,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  hlKey?: string;
}) {
  return (
    <div data-demo-hl={hlKey} className="lp-surface overflow-hidden">
      <table className="lp-table text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={j === 0 ? "lp-cell-strong" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tabs({
  items,
  active,
  hlKey,
}: {
  items: string[];
  active: string;
  hlKey?: string;
}) {
  return (
    <div data-demo-hl={hlKey}>
      <SegmentedControl
        className="m-seg-wrap-wide"
        ariaLabel="Sections"
        value={active}
        segments={items.map((t) => ({ id: t, label: t }))}
      />
    </div>
  );
}

const STAFF_NAV = [
  "Dashboard",
  "Jobs",
  "Notifications",
  "Inventory",
  "Team",
  "Clients",
  "Settings",
];

export function DemoScreen({ screen }: { screen: DemoScreenId }) {
  if (screen === "portal-jobs" || screen === "portal-inventory") {
    return (
      <div
        className="lp-app flex h-full min-h-0 flex-col"
        style={tenantThemeStyle(DEMO_ORG.primary)}
      >
        <header data-demo-hl="portal-brand" className="lp-window-head shrink-0">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--lp-fg)]">
                {DEMO_ORG.name}
              </p>
              <p className="text-[11px] text-[var(--lp-muted)]">Client portal</p>
            </div>
            <p className="text-xs text-[var(--lp-muted)]">
              Alex Chen · Summit Brands
            </p>
          </div>
          <div className="px-5 pb-3.5">
            <SegmentedControl
              className="m-seg-wrap-wide"
              ariaLabel="Portal"
              value={screen === "portal-inventory" ? "Inventory" : "Jobs"}
              segments={["Home", "Jobs", "Inventory", "Notes"].map((label) => ({
                id: label,
                label,
              }))}
            />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
          {screen === "portal-jobs" ? (
            <>
              <h2 className="lp-page-title text-lg">Your jobs</h2>
              <p className="lp-page-sub text-xs">
                Request work. Track status. Upload docs.
              </p>
              <div className="mt-4">
                <Table
                  headers={["Job", "Date", "Status"]}
                  rows={DEMO_PORTAL_JOBS.map((j) => [
                    j.name,
                    j.when,
                    <StatusBadge key={j.id} status={j.status} kind="job" />,
                  ])}
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="lp-page-title text-lg">Your inventory</h2>
              <p className="lp-page-sub text-xs">
                Stored with {DEMO_ORG.shortName}. Request changes anytime.
              </p>
              <div data-demo-hl="portal-inv" className="mt-4">
                <Table
                  headers={["SKU", "Name", "Qty"]}
                  rows={DEMO_INVENTORY_CLIENT.map((i) => [
                    i.sku,
                    i.name,
                    String(i.qty),
                  ])}
                />
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  if (screen === "my-jobs") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={["Dashboard", "My Jobs", "Notifications", "Settings"]}
        user="Chris Park · Staff"
        activeNav="My Jobs"
      >
        <h2 className="lp-page-title text-lg">My Jobs</h2>
        <p className="lp-page-sub text-xs">Only jobs you’re assigned to.</p>
        <div data-demo-hl="my-jobs" className="mt-4">
          <Table
            headers={["Job", "Client", "When", "Status"]}
            rows={DEMO_MY_JOBS.map((j) => [
              j.name,
              j.client,
              j.when,
              <StatusBadge key={j.id} status={j.status} kind="job" />,
            ])}
          />
        </div>
      </Shell>
    );
  }

  if (screen === "dashboard") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={STAFF_NAV}
        user="Morgan Hale · Manager"
        activeNav="Dashboard"
      >
        <h2 className="lp-page-title text-lg">Good morning, Morgan</h2>
        <p className="lp-page-sub text-xs">{DEMO_ORG.name}</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div data-demo-hl="needs">
            <p className="lp-section-title mb-2">Needs attention</p>
            <ul className="lp-list text-xs">
              {DEMO_NEEDS.map((n) => (
                <li key={n.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--subtle)]">
                    {n.kind}
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[var(--subtle)]">{n.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="lp-section-title mb-2">Upcoming work</p>
            <Table
              headers={["Job", "Status", "When"]}
              rows={DEMO_JOBS.filter((j) =>
                ["upcoming", "ready"].includes(j.status)
              ).map((j) => [
                j.name,
                <StatusBadge key={j.id} status={j.status} kind="job" />,
                j.when,
              ])}
            />
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "jobs") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={STAFF_NAV}
        user="Morgan Hale · Manager"
        activeNav="Jobs"
      >
        <h2 className="lp-page-title text-lg">Jobs</h2>
        <p className="lp-page-sub text-xs">List · Calendar</p>
        <div data-demo-hl="statuses" className="mt-4">
          <Table
            headers={["Job", "Client", "When", "Status"]}
            rows={DEMO_JOBS.filter((j) => j.status !== "denied").map((j) => [
              j.name,
              j.client,
              j.when,
              <StatusBadge key={j.id} status={j.status} kind="job" />,
            ])}
          />
        </div>
      </Shell>
    );
  }

  if (screen === "job") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={STAFF_NAV}
        user="Morgan Hale · Manager"
        activeNav="Jobs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="lp-page-title text-lg">Waterfront Festival</h2>
          <StatusBadge status="ready" kind="job" />
        </div>
        <p className="lp-page-sub text-xs">
          Summit Brands · Fri, Sep 19, 2026 · POC Jordan Lee
        </p>
        <div className="mt-4">
          <Tabs
            hlKey="tabs"
            active="Inventory"
            items={[
              "Summary",
              "Locations",
              "Inventory",
              "Fleet",
              "Crew",
              "Documents",
            ]}
          />
        </div>
        <div data-demo-hl="loaded" className="mt-4">
          <Table
            headers={["Source", "Item", "Assigned", "Loaded"]}
            rows={DEMO_JOB_LINES.map((l) => [
              l.source,
              l.name,
              String(l.assigned),
              <span
                key={l.name}
                className="font-semibold text-[var(--success)]"
              >
                {l.loaded}
              </span>,
            ])}
          />
        </div>
        <div data-demo-hl="crew" className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="lp-section-title mb-2">Fleet</p>
            <ul className="lp-list text-xs">
              {DEMO_FLEET.slice(0, 2).map((f) => (
                <li key={f.name}>
                  {f.name}{" "}
                  <span className="text-[var(--subtle)]">· {f.plate}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="lp-section-title mb-2">Crew</p>
            <ul className="lp-list text-xs">
              {DEMO_CREW.slice(0, 4).map((c) => (
                <li key={`${c.name}-${c.phase}`}>
                  {c.name}{" "}
                  <span className="text-[var(--subtle)]">
                    · {c.phase} · {c.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "inventory") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={STAFF_NAV}
        user="Morgan Hale · Manager"
        activeNav="Inventory"
      >
        <h2 className="lp-page-title text-lg">Inventory</h2>
        <div className="mt-4">
          <Tabs
            hlKey="tabs-inv"
            active="Client"
            items={["Client", "Equipment", "Fleet"]}
          />
        </div>
        <p className="mt-4 text-sm font-semibold">Summit Brands</p>
        <div className="mt-3">
          <Table
            headers={["SKU", "Name", "Qty"]}
            rows={DEMO_INVENTORY_CLIENT.map((i) => [
              i.sku,
              i.name,
              String(i.qty),
            ])}
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-[var(--subtle)]">
          Equipment (yours) · {DEMO_INVENTORY_ORG.length} items · Fleet ·{" "}
          {DEMO_FLEET.length} vehicles
        </p>
      </Shell>
    );
  }

  if (screen === "notifications") {
    return (
      <Shell
        brand={DEMO_ORG.name}
        nav={STAFF_NAV}
        user="Morgan Hale · Manager"
        activeNav="Notifications"
      >
        <h2 className="lp-page-title text-lg">Notifications</h2>
        <div data-demo-hl="inbox" className="mt-4">
          <ul className="lp-list">
            {DEMO_NEEDS.map((n) => (
              <li
                key={n.title}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--subtle)]">
                    {n.kind}
                  </p>
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] text-[var(--subtle)]">{n.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[var(--primary)]">
                  Review
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      brand={DEMO_ORG.name}
      nav={STAFF_NAV}
      user="Morgan Hale · Manager"
      activeNav="Team"
    >
      <div data-demo-hl="people">
        <h2 className="lp-page-title text-lg">Team</h2>
        <div className="mt-3">
          <Table
            headers={["Name", "Role", "Tags"]}
            rows={DEMO_TEAM.map((t) => [t.name, t.role, t.tags])}
          />
        </div>
        <h2 className="lp-page-title mt-6 text-lg">Clients</h2>
        <div className="mt-3 space-y-3">
          {DEMO_CLIENTS.map((c) => (
            <div key={c.company} className="lp-surface p-3">
              <p className="text-sm font-semibold">{c.company}</p>
              <p className="mt-1 text-xs text-[var(--subtle)]">
                {c.contacts.map((x) => `${x.name} (${x.title})`).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
