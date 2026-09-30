"use client";

import { motion, useReducedMotion } from "framer-motion";

type Segment = {
  id: string;
  label: string;
};

/** Classic iOS blue segmented control with sliding gloss thumb. */
export function SegmentedControl({
  segments,
  value,
  onChange,
  ariaLabel = "View",
}: {
  segments: readonly Segment[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.id === value),
  );

  return (
    <div className="m-seg-wrap">
      <div className="m-seg" role="tablist" aria-label={ariaLabel}>
        {!reduceMotion ? (
          <motion.span
            className="m-seg-thumb"
            aria-hidden
            animate={{
              left: `${(activeIndex * 100) / segments.length}%`,
            }}
            style={{ width: `${100 / segments.length}%` }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        ) : null}
        {segments.map((seg) => {
          const selected = seg.id === value;
          return (
            <button
              key={seg.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`m-seg-item${selected ? " m-seg-item-active" : ""}`}
              onClick={() => onChange(seg.id)}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
