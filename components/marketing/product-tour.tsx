"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

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
        <Link href="/demo" className="m-btn-primary px-4 py-2 text-sm">
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
        inset
        toolbar={
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={active}
              className="m-window-caption text-[var(--m-muted)]"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={panelTransition}
            >
              {current.body}
            </motion.p>
          </AnimatePresence>
        }
      >
        <div className="m-tour-split">
          <nav className="m-tour-sidebar" aria-label="Demo sections">
            {SEGMENTS.map((seg) => {
              const selected = seg.id === active;
              return (
                <button
                  key={seg.id}
                  type="button"
                  className={`m-tour-sidebar-item${selected ? " m-tour-sidebar-item-active" : ""}`}
                  onClick={() => setActive(seg.id)}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="m-tour-sidebar-dot" aria-hidden />
                  {seg.label}
                </button>
              );
            })}
          </nav>
          <div className="m-tour-stage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={
                  reduceMotion ? false : { opacity: 0, x: 28, filter: "blur(6px)" }
                }
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion ? undefined : { opacity: 0, x: -20, filter: "blur(4px)" }
                }
                transition={panelTransition}
              >
                <Link
                  href="/demo"
                  className="m-tour-window-link"
                  aria-label={`Open demo — ${current.title}`}
                >
                  <TourMock kind={current.id as MockKind} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}
