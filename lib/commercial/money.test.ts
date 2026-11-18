import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCommercialTotals,
  formatCents,
  lineTotalFromQtyPrice,
  parseDollarsToCents,
  type LineForTotals,
} from "./money";
import { formatDocumentNumber } from "./numbering";

describe("parseDollarsToCents", () => {
  it("parses plain, formatted and signed amounts", () => {
    assert.equal(parseDollarsToCents("12"), 1200);
    assert.equal(parseDollarsToCents("$1,234.50"), 123450);
    assert.equal(parseDollarsToCents("  0.99 "), 99);
    assert.equal(parseDollarsToCents(".5"), 50);
    assert.equal(parseDollarsToCents("5."), 500);
    assert.equal(parseDollarsToCents("-5.5"), -550);
    assert.equal(parseDollarsToCents("+3"), 300);
    assert.equal(parseDollarsToCents(""), 0);
    assert.equal(parseDollarsToCents("   "), 0);
    assert.equal(parseDollarsToCents("$"), 0); // symbol stripped, nothing left
  });

  it("is exact where floating point is not", () => {
    // 19.99 * 100 === 1998.9999999999998 and 1.005 * 100 === 100.49999999999999
    assert.equal(parseDollarsToCents("19.99"), 1999);
    assert.equal(parseDollarsToCents("1.005"), 101);
    assert.equal(parseDollarsToCents("0.07"), 7);
    assert.equal(parseDollarsToCents("1.15"), 115);
  });

  it("rounds half up on the third decimal", () => {
    assert.equal(parseDollarsToCents("1.004"), 100);
    assert.equal(parseDollarsToCents("1.0049"), 100);
    assert.equal(parseDollarsToCents("1.005"), 101);
    assert.equal(parseDollarsToCents("1.0051"), 101);
    assert.equal(parseDollarsToCents("-1.005"), -101);
  });

  it("rejects things that are not plain decimal amounts", () => {
    for (const bad of ["abc", "1e3", "0x10", "Infinity", "NaN", "1.2.3", "--5", ".", "-", "1 000"]) {
      assert.throws(() => parseDollarsToCents(bad), /Invalid amount/, bad);
    }
  });

  it("rejects amounts too large to represent exactly", () => {
    assert.throws(() => parseDollarsToCents("99999999999999999999"), /Invalid amount/);
  });
});

describe("lineTotalFromQtyPrice", () => {
  it("multiplies and rounds to whole cents", () => {
    assert.equal(lineTotalFromQtyPrice(3, 1999), 5997);
    assert.equal(lineTotalFromQtyPrice(1.5, 333), 500);
    assert.equal(lineTotalFromQtyPrice(0, 1999), 0);
  });
});

describe("computeCommercialTotals", () => {
  const line = (
    lineTotalCents: number,
    taxable: boolean,
    kind = "item"
  ): LineForTotals => ({ lineTotalCents, taxable, kind });

  it("sums lines and applies tax only to taxable lines", () => {
    const totals = computeCommercialTotals({
      lines: [line(10000, true), line(5000, false)],
      defaultTaxRateBps: 800, // 8%
    });
    assert.deepEqual(totals, {
      subtotalCents: 15000,
      taxCents: 800,
      totalCents: 15800,
    });
  });

  it("rounds tax to the nearest cent", () => {
    const totals = computeCommercialTotals({
      lines: [line(1999, true)],
      defaultTaxRateBps: 875, // 8.75% of 19.99 = 1.749125
    });
    assert.equal(totals.taxCents, 175);
    assert.equal(totals.totalCents, 2174);
  });

  it("ignores tax and deposit lines when summing", () => {
    const totals = computeCommercialTotals({
      lines: [line(10000, true), line(999, true, "tax"), line(2500, false, "deposit")],
      defaultTaxRateBps: 0,
    });
    assert.deepEqual(totals, { subtotalCents: 10000, taxCents: 0, totalCents: 10000 });
  });

  it("reduces the subtotal by discounts but, today, not the taxable base", () => {
    // Documents current behaviour: tax is computed on pre-discount taxable lines.
    // If discounts should reduce the taxable amount, change this test and the code together.
    const totals = computeCommercialTotals({
      lines: [line(10000, true), line(-1000, true, "discount")],
      defaultTaxRateBps: 1000,
    });
    assert.equal(totals.subtotalCents, 9000);
    assert.equal(totals.taxCents, 1000);
    assert.equal(totals.totalCents, 10000);
  });

  it("handles no lines", () => {
    assert.deepEqual(computeCommercialTotals({ lines: [], defaultTaxRateBps: 800 }), {
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });
});

describe("formatCents / formatDocumentNumber", () => {
  it("formats USD", () => {
    assert.equal(formatCents(123450), "$1,234.50");
    assert.equal(formatCents(-550), "-$5.50");
    assert.equal(formatCents(0), "$0.00");
  });

  it("pads document numbers and embeds the year", () => {
    assert.equal(formatDocumentNumber("INV", 7, 2026), "INV-2026-0007");
    assert.equal(formatDocumentNumber("Q", 12345, 2026), "Q-2026-12345");
  });
});
