"use client";

import Link from "next/link";
import { useState } from "react";
import { AppWindow } from "@/components/marketing/app-window";
import { TourMock, type MockKind } from "@/components/marketing/product-mocks";
import { SegmentedControl } from "@/components/marketing/segmented-control";

const SEGMENTS = [
  { id: "jobs", label: "Jobs", title: "Jobs", body: "Statuses, calendar, and a run sheet with locations, loads, trucks, and crew." },
  { id: "inventory", label: "Inventory", title: "Inventory & fleet", body: "Client gear, your equipment, and vehicles — locked to the job while it’s live." },
  { id: "portal", label: "Portal", title: "Client portal", body: "Branded requests, docs, and inventory asks. Company-scoped. Invite-only." },
  { id: "staff", label: "Staff", title: "Staff on the dock", body: "My Jobs only. Loaded vs assigned. Print the run sheet from a phone." },
] as const;

export function ProductTour() {
  const [active, setActive] = useState<string>("jobs");
  const current = SEGMENTS.find((s) => s.id === active) ?? SEGMENTS[0];

  return (
    <div className="m-tour-block">
      <div className="m-tour-rail">
        <div className="max-w-xl">
          <h2 className="m-section-title">Product demo</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
            Walk the product — no login. Flip the segments, then open the full
            interactive tour.
          </p>
        </div>
        <Link href="/demo" className="m-btn-primary px-4 py-2 text-sm font-semibold">
          Start interactive demo
        </Link>
      </div>

      <div className="m-tour-controls">
        <SegmentedControl
          segments={SEGMENTS.map(({ id, label }) => ({ id, label }))}
          value={active}
          onChange={setActive}
          ariaLabel="Product areas"
        />
      </div>

      <AppWindow
        title={current.title}
        toolbar={
          <p className="m-window-caption text-[var(--m-muted)]">{current.body}</p>
        }
      >
        <Link
          href="/demo"
          className="m-tour-window-link"
          aria-label={`Open demo — ${current.title}`}
        >
          <TourMock kind={current.id as MockKind} />
        </Link>
      </AppWindow>
    </div>
  );
}
