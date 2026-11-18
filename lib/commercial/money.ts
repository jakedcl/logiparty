export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Parse a user-entered dollar amount ("12", "$1,234.50", "-5.5") to integer
 * cents using exact decimal arithmetic (no floating point). More than two
 * decimals round half up on the third digit. Empty input is 0. Anything that
 * is not a plain decimal number (exponents, hex, "NaN", stray text) throws.
 */
export function parseDollarsToCents(raw: string): number {
  const value = raw.trim().replace(/[$,]/g, "");
  if (!value) return 0;
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(value);
  if (!match) throw new Error("Invalid amount");
  const [, sign, whole, fraction = ""] = match;
  if (whole === "" && fraction === "") throw new Error("Invalid amount");

  let cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  if (fraction.length > 2 && fraction.charCodeAt(2) >= 53 /* '5' */) cents += 1;
  if (!Number.isSafeInteger(cents)) throw new Error("Invalid amount");
  return sign === "-" ? -cents : cents;
}

export type LineForTotals = {
  lineTotalCents: number;
  taxable: boolean;
  kind: string;
};

export function computeCommercialTotals(args: {
  lines: LineForTotals[];
  defaultTaxRateBps: number;
}): { subtotalCents: number; taxCents: number; totalCents: number } {
  let subtotalCents = 0;
  let taxableCents = 0;
  for (const line of args.lines) {
    if (line.kind === "tax" || line.kind === "deposit") continue;
    subtotalCents += line.lineTotalCents;
    if (line.taxable && line.kind !== "discount") {
      taxableCents += line.lineTotalCents;
    }
  }
  const taxCents = Math.round(
    (taxableCents * args.defaultTaxRateBps) / 10000
  );
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}

export function lineTotalFromQtyPrice(
  quantity: number,
  unitPriceCents: number
): number {
  return Math.round(quantity * unitPriceCents);
}
