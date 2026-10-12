/** Default accent — early-iPhone blue. Orgs override this via OrgTheme. */
export const FALLBACK_PRIMARY_COLOR = "#0b5cab";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PAPER = "#ffffff";
/** Landing body ink. Pale brands use this instead of the old navy. */
const INK = "#1a1a1a";

/** Normalize org `primary_color` or fall back to the product blue. */
export function resolvePrimaryColor(
  value: string | null | undefined
): string {
  const raw = value?.trim();
  if (!raw || !HEX.test(raw)) return FALLBACK_PRIMARY_COLOR;
  if (raw.length === 4) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, other: string, weight: number): string {
  const [r1, g1, b1] = rgb(hex);
  const [r2, g2, b2] = rgb(other);
  const ch = (a: number, b: number) =>
    Math.round(a * weight + b * (1 - weight));
  return `#${[ch(r1, r2), ch(g1, g2), ch(b1, b2)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Light or dark label so brand fills stay readable (WCAG AA body text). */
export function primaryForeground(primary: string): string {
  const onPaper = contrast(primary, PAPER);
  const onInk = contrast(primary, INK);
  if (onPaper >= 4.5) return PAPER;
  if (onInk >= 4.5) return INK;
  return onPaper >= onInk ? PAPER : INK;
}

/** Darken the brand until a 1px edge clears 3:1 on a white panel. */
export function primaryBorder(primary: string): string {
  let color = primary;
  for (let i = 0; i < 8; i++) {
    if (contrast(color, PAPER) >= 3) return color;
    color = mix(color, "#000000", 0.8);
  }
  return color;
}

/** Inline CSS vars so Tailwind `bg-primary` / `ring-primary` follow the tenant. */
export function tenantThemeStyle(
  primaryColor: string | null | undefined
): Record<string, string> {
  const primary = resolvePrimaryColor(primaryColor);
  const foreground = primaryForeground(primary);
  const border = primaryBorder(primary);
  return {
    "--primary": primary,
    "--primary-foreground": foreground,
    "--primary-border": border,
    "--ring": primary,
    "--color-primary": primary,
    "--color-primary-foreground": foreground,
    "--color-ring": primary,
  };
}
