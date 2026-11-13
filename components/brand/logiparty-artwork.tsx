import { BRAND, HANDOFF_L, HANDOFF_P, HANDOFF_WORDMARK_PATHS } from "@/lib/brand/identity";

/** Shared vector artwork for the website, icons, and generated social images. */
export function LogipartyArtwork({
  height = 32,
  wordmark = false,
  reversed = false,
  title = "Logiparty",
  decorative = false,
  className,
}: {
  height?: number;
  wordmark?: boolean;
  reversed?: boolean;
  title?: string;
  decorative?: boolean;
  className?: string;
}) {
  const width = wordmark ? 310 : 70;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} 64`}
      width={height * width / 64}
      height={height}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
    >
      {!decorative ? <title>{title}</title> : null}
      <g
        transform={wordmark ? "translate(0 3) scale(0.84375)" : undefined}
        fill="none"
        strokeWidth="10"
        strokeLinejoin="round"
      >
        <path d={HANDOFF_L} stroke={reversed ? "#FFFFFF" : BRAND.cobalt} />
        <path d={HANDOFF_P} stroke={BRAND.coral} />
      </g>
      {wordmark ? (
        <g fill={reversed ? "#FFFFFF" : BRAND.ink}>
          {HANDOFF_WORDMARK_PATHS.map((d, index) => <path key={index} d={d} />)}
        </g>
      ) : null}
    </svg>
  );
}
