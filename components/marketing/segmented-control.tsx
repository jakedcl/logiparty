"use client";

type Segment = {
  id: string;
  label: string;
};

/** Classic iOS blue segmented control. */
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
  return (
    <div className="m-seg" role="tablist" aria-label={ariaLabel}>
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
  );
}
