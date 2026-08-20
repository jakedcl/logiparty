/**
 * Soft SKU normalize: trim, uppercase, keep letters/numbers/`-`/`_`.
 * Does not reject — strips noise so real SKUs still submit.
 */
export function normalizeSku(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}
