/**
 * Integration check for allocateDocumentNumber against a real database.
 * Run: DATABASE_URL=<throwaway branch> npx tsx scripts/numbering-check.ts
 * Temporarily advances the `test` org's counters, then restores them.
 * Never run it against production.
 */
import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { allocateDocumentNumber } = await import("../lib/commercial/allocate-number");
  if (!db) throw new Error("DATABASE_URL required");

  const where = eq(schema.organizations.slug, "test");
  const [org] = await db.select().from(schema.organizations).where(where).limit(1);
  if (!org) throw new Error("org `test` not found");
  const results: string[] = [];
  const expect = (ok: boolean, label: string) => results.push((ok ? "PASS " : "FAIL ") + label);

  try {
    for (const kind of ["quote", "invoice"] as const) {
      const start = kind === "quote" ? org.nextQuoteNumber : org.nextInvoiceNumber;
      const prefix = kind === "quote" ? org.quotePrefix : org.invoicePrefix;
      const nums = await Promise.all(
        Array.from({ length: 10 }, () => allocateDocumentNumber(org.id, kind))
      );
      const seqs = nums.map((n) => Number(n.split("-").pop())).sort((a, b) => a - b);
      const [after] = await db.select().from(schema.organizations).where(where).limit(1);
      const counter = kind === "quote" ? after.nextQuoteNumber : after.nextInvoiceNumber;
      expect(new Set(nums).size === 10, `${kind}: 10 concurrent allocations are all distinct`);
      expect(
        seqs[0] === start && seqs[9] === start + 9 && counter === start + 10,
        `${kind}: numbers are ${start}..${start + 9} and the counter advanced to ${counter}`
      );
      expect(nums.every((n) => n.startsWith(`${prefix}-`)), `${kind}: numbers use the org prefix (${prefix})`);
    }
  } finally {
    await db.update(schema.organizations)
      .set({ nextQuoteNumber: org.nextQuoteNumber, nextInvoiceNumber: org.nextInvoiceNumber })
      .where(where);
  }
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
