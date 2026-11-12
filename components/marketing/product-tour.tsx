"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppWindow } from "@/components/marketing/app-window";
import { SegmentedControl } from "@/components/marketing/segmented-control";
import { Button } from "@/components/ui/button";

const SEGMENTS = [
  {
    id: "jobs",
    label: "Jobs",
    title: "Jobs",
    body: "Statuses, calendar, and a run sheet with locations, loads, trucks, and crew.",
    image: "/marketing/jobs-list.png",
    alt: "Jobs list with filters and load windows",
  },
  {
    id: "inventory",
    label: "Inventory",
    title: "Inventory & fleet",
    body: "Client gear, your equipment, and vehicles — locked to the job while it’s live.",
    image: "/marketing/inventory.png",
    alt: "Inventory catalogs for client and org equipment",
  },
  {
    id: "portal",
    label: "Portal",
    title: "Client portal",
    body: "Branded requests, docs, and inventory asks. Company-scoped. Invite-only.",
    image: "/marketing/portal.png",
    alt: "White-label client portal jobs view",
  },
  {
    id: "staff",
    label: "Staff",
    title: "Staff on the dock",
    body: "My Jobs only. Loaded vs assigned. Print the run sheet from a phone.",
    image: "/marketing/my-jobs.png",
    alt: "My Jobs list for assigned crew",
  },
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
            Same Northline Logistics sample data as the screenshots above. Flip
            segments, then open the full step-by-step tour.
          </p>
        </div>
        <Button asChild className="px-4 py-2 text-sm">
          <Link href="/demo">Start interactive demo</Link>
        </Button>
      </div>

      <div className="m-tour-controls">
        <SegmentedControl
          segments={SEGMENTS.map(({ id, label }) => ({ id, label }))}
          value={active}
          onChange={setActive}
          ariaLabel="Product areas"
        />
      </div>

      <AppWindow title={current.title} inset>
        <p className="m-window-caption mb-3 text-[var(--m-muted)]">{current.body}</p>
        <Link
          href="/demo"
          className="m-tour-window-link block overflow-hidden rounded-md border border-[var(--m-line)]"
          aria-label={`Open demo — ${current.title}`}
        >
          <Image
            src={current.image}
            alt={current.alt}
            width={1200}
            height={750}
            className="h-auto w-full"
            sizes="(max-width: 768px) 100vw, 900px"
          />
        </Link>
      </AppWindow>
    </div>
  );
}
