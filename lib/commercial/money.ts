export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function parseDollarsToCents(raw: string): number {
  const value = raw.trim().replace(/[$,]/g, "");
  if (!value) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * 100);
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
