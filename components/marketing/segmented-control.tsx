"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Segment = {
  id: string;
  label: string;
  href?: string;
  /** Next.js link scroll. Inventory tabs keep the page position. */
  scroll?: boolean;
};

/** Landing-page segmented control. Same capsule in marketing, portal, and demo. */
export function SegmentedControl({
  segments,
  value,
  onChange,
  ariaLabel = "View",
  className,
}: {
  segments: readonly Segment[];
  value: string;
  onChange?: (id: string) => void;
  ariaLabel?: string;
  /** Extra classes on the outer capsule (e.g. m-seg-wrap-wide). */
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.id === value),
  );
  const itemClass = (selected: boolean) =>
    `m-seg-item${selected ? " m-seg-item-active" : ""}`;

  return (
    <div className={cn("m-seg-wrap", className)}>
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
          if (seg.href) {
            return (
              <Link
                key={seg.id}
                href={seg.href}
                scroll={seg.scroll}
                role="tab"
                aria-selected={selected}
                className={itemClass(selected)}
                aria-current={selected ? "page" : undefined}
              >
                {seg.label}
              </Link>
            );
          }
          return (
            <button
              key={seg.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={itemClass(selected)}
              onClick={() => onChange?.(seg.id)}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
