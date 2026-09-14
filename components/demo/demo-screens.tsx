"use client";

import { cn } from "@/lib/utils";
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

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "draft" | "upcoming" | "ready" | "completed" | "denied" | "neutral";
}) {
  const tones: Record<string, string> = {
    draft: "bg-amber-50 text-amber-900 ring-amber-200",
    upcoming: "bg-sky-50 text-sky-900 ring-sky-200",
    ready: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    completed: "bg-neutral-100 text-neutral-600 ring-neutral-200",
    denied: "bg-red-50 text-red-900 ring-red-200",
    neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

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
    <div className="flex h-full min-h-0 bg-[#f3f5f8] text-[#0b1526]">
      <aside className="hidden w-52 shrink-0 flex-col bg-[#0b1526] text-[#f0f4fa] sm:flex">
        <div data-demo-hl="brand" className="border-b border-white/10 px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aabbf]">
            Workspace
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-snug">{brand}</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 text-xs">
          {nav.map((label) => (
            <span
              key={label}
              className={cn(
                "rounded px-2.5 py-2",
                label === activeNav
                  ? "bg-white/10 font-medium"
                  : "text-[#9aabbf]"
              )}
            >
              {label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#c9d2de] bg-white px-5 py-3">
          <p
            data-demo-hl="brand"
            className="text-xs font-medium text-[#3d4a5c] sm:hidden"
          >
            {brand}
          </p>
          <p className="ml-auto text-xs text-[#3d4a5c]">{user}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">{children}</div>
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
    <div
      data-demo-hl={hlKey}
      className="overflow-hidden rounded-sm border border-[#c9d2de] bg-white"
    >
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#dde3ec] bg-[#eef1f6] text-[10px] uppercase tracking-wide text-[#5c6b7e]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#dde3ec] last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-middle">
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
      <div className="flex h-full min-h-0 flex-col bg-white text-[#0b1526]">
        <header
          data-demo-hl="portal-brand"
          className="flex items-center justify-between border-b border-[#c9d2de] px-5 py-4"
          style={{ borderTop: `3px solid ${DEMO_ORG.primary}` }}
        >
          <div>
            <p className="text-sm font-semibold">{DEMO_ORG.name}</p>
            <p className="text-[11px] text-[#5c6b7e]">Client portal</p>
          </div>
          <p className="text-xs text-[#3d4a5c]">Alex Chen · Summit Brands</p>
        </header>
        <div className="flex gap-5 border-b border-[#dde3ec] px-5 text-xs">
          {["Home", "Jobs", "Inventory", "Notes"].map((l) => (
            <span
              key={l}
              className={cn(
                "border-b-2 py-3",
                (screen === "portal-jobs" && l === "Jobs") ||
                  (screen === "portal-inventory" && l === "Inventory")
                  ? "border-[#1e3a5f] font-semibold"
                  : "border-transparent text-[#5c6b7e]"
              )}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
          {screen === "portal-jobs" ? (
            <>
              <h2 className="text-lg font-semibold tracking-tight">Your jobs</h2>
              <p className="mt-1 text-xs text-[#5c6b7e]">
                Request work. Track status. Upload docs.
              </p>
              <div className="mt-4">
                <Table
                  headers={["Job", "Date", "Status"]}
                  rows={DEMO_PORTAL_JOBS.map((j) => [
                    j.name,
                    j.when,
                    <Chip key={j.id} tone={j.status}>
                      {j.status}
                    </Chip>,
                  ])}
                />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                Your inventory
              </h2>
              <p className="mt-1 text-xs text-[#5c6b7e]">
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
        </div>
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
        <h2 className="text-lg font-semibold tracking-tight">My Jobs</h2>
        <p className="mt-1 text-xs text-[#5c6b7e]">
          Only jobs you’re assigned to.
        </p>
        <div data-demo-hl="my-jobs" className="mt-4">
          <Table
            headers={["Job", "Client", "When", "Status"]}
            rows={DEMO_MY_JOBS.map((j) => [
              j.name,
              j.client,
              j.when,
              <Chip key={j.id} tone={j.status}>
                {j.status}
              </Chip>,
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
        <h2 className="text-lg font-semibold tracking-tight">
          Good morning, Morgan
        </h2>
        <p className="mt-1 text-xs text-[#5c6b7e]">{DEMO_ORG.name}</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div data-demo-hl="needs">
            <p className="mb-2 text-xs font-semibold">Needs attention</p>
            <ul className="border border-[#c9d2de] bg-white">
              {DEMO_NEEDS.map((n) => (
                <li
                  key={n.title}
                  className="border-b border-[#dde3ec] px-3 py-2.5 last:border-0"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c6b7e]">
                    {n.kind}
                  </p>
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] text-[#5c6b7e]">{n.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Upcoming work</p>
            <Table
              headers={["Job", "Status", "When"]}
              rows={DEMO_JOBS.filter((j) =>
                ["upcoming", "ready"].includes(j.status)
              ).map((j) => [
                j.name,
                <Chip key={j.id} tone={j.status}>
                  {j.status}
                </Chip>,
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
        <h2 className="text-lg font-semibold tracking-tight">Jobs</h2>
        <p className="mt-1 text-xs text-[#5c6b7e]">List · Calendar</p>
        <div data-demo-hl="statuses" className="mt-4">
          <Table
            headers={["Job", "Client", "When", "Status"]}
            rows={DEMO_JOBS.filter((j) => j.status !== "denied").map((j) => [
              j.name,
              j.client,
              j.when,
              <Chip key={j.id} tone={j.status}>
                {j.status}
              </Chip>,
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
          <h2 className="text-lg font-semibold tracking-tight">
            Waterfront Festival
          </h2>
          <Chip tone="ready">ready</Chip>
        </div>
        <p className="mt-1 text-xs text-[#5c6b7e]">
          Summit Brands · Fri, Sep 19, 2026 · POC Jordan Lee
        </p>
        <div
          data-demo-hl="tabs"
          className="mt-4 flex gap-4 border-b border-[#c9d2de] text-xs"
        >
          {[
            "Summary",
            "Locations",
            "Inventory",
            "Fleet",
            "Crew",
            "Documents",
          ].map((t, i) => (
            <span
              key={t}
              className={cn(
                "border-b-2 py-2.5",
                i === 2
                  ? "border-[#1e3a5f] font-semibold"
                  : "border-transparent text-[#5c6b7e]"
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div data-demo-hl="loaded" className="mt-4">
          <Table
            headers={["Source", "Item", "Assigned", "Loaded"]}
            rows={DEMO_JOB_LINES.map((l) => [
              l.source,
              l.name,
              String(l.assigned),
              <span key={l.name} className="font-semibold text-emerald-800">
                {l.loaded}
              </span>,
            ])}
          />
        </div>
        <div data-demo-hl="crew" className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold">Fleet</p>
            <ul className="border border-[#c9d2de] bg-white text-xs">
              {DEMO_FLEET.slice(0, 2).map((f) => (
                <li
                  key={f.name}
                  className="border-b border-[#dde3ec] px-3 py-2.5 last:border-0"
                >
                  {f.name}{" "}
                  <span className="text-[#5c6b7e]">· {f.plate}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Crew</p>
            <ul className="border border-[#c9d2de] bg-white text-xs">
              {DEMO_CREW.slice(0, 4).map((c) => (
                <li
                  key={`${c.name}-${c.phase}`}
                  className="border-b border-[#dde3ec] px-3 py-2.5 last:border-0"
                >
                  {c.name}{" "}
                  <span className="text-[#5c6b7e]">
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
        <h2 className="text-lg font-semibold tracking-tight">Inventory</h2>
        <div
          data-demo-hl="tabs-inv"
          className="mt-4 flex gap-4 border-b border-[#c9d2de] text-xs"
        >
          {["Client", "Equipment", "Fleet"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "border-b-2 py-2.5",
                i === 0
                  ? "border-[#1e3a5f] font-semibold"
                  : "border-transparent text-[#5c6b7e]"
              )}
            >
              {t}
            </span>
          ))}
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
        <p className="mt-4 text-xs font-semibold text-[#5c6b7e]">
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
        <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
        <div data-demo-hl="inbox" className="mt-4">
          <ul className="border border-[#c9d2de] bg-white">
            {DEMO_NEEDS.map((n) => (
              <li
                key={n.title}
                className="flex items-center justify-between gap-3 border-b border-[#dde3ec] px-3 py-3 last:border-0"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5c6b7e]">
                    {n.kind}
                  </p>
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] text-[#5c6b7e]">{n.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[#1e3a5f]">
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
        <h2 className="text-lg font-semibold tracking-tight">Team</h2>
        <div className="mt-3">
          <Table
            headers={["Name", "Role", "Tags"]}
            rows={DEMO_TEAM.map((t) => [t.name, t.role, t.tags])}
          />
        </div>
        <h2 className="mt-6 text-lg font-semibold tracking-tight">Clients</h2>
        <div className="mt-3 space-y-3">
          {DEMO_CLIENTS.map((c) => (
            <div key={c.company} className="border border-[#c9d2de] bg-white p-3">
              <p className="text-sm font-semibold">{c.company}</p>
              <p className="mt-1 text-xs text-[#5c6b7e]">
                {c.contacts.map((x) => `${x.name} (${x.title})`).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
