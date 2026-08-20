/** Deep navy / ink blue — calm enterprise fallback (not indigo glow). */
export const FALLBACK_PRIMARY_COLOR = "#1e3a5f";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Normalize org `primary_color` or fall back to system navy. */
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

/** Inline CSS vars so Tailwind `bg-primary` / `ring-primary` follow the tenant. */
export function tenantThemeStyle(
  primaryColor: string | null | undefined
): Record<string, string> {
  const primary = resolvePrimaryColor(primaryColor);
  return {
    "--primary": primary,
    "--ring": primary,
    "--color-primary": primary,
    "--color-ring": primary,
  };
}
